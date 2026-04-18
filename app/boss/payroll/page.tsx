'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRM } from '@/lib/utils'
import { Payslip, PayrollRun, Driver } from '@/lib/types'
import { Loader2, Download, Lock, RefreshCw } from 'lucide-react'
import { format, subMonths } from 'date-fns'

export default function PayrollPage() {
  const supabase = createClient()
  const [runs, setRuns] = useState<PayrollRun[]>([])
  const [activeRun, setActiveRun] = useState<PayrollRun | null>(null)
  const [payslips, setPayslips] = useState<(Payslip & { drivers: Driver })[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [locking, setLocking] = useState(false)

  async function load() {
    setLoading(true)
    const { data: runData } = await supabase
      .from('payroll_runs')
      .select('*')
      .order('period_start', { ascending: false })
      .limit(6)
    setRuns(runData ?? [])

    if (runData?.length) {
      setActiveRun(runData[0])
      const { data: slips } = await supabase
        .from('payslips')
        .select('*, drivers(*)')
        .eq('payroll_run_id', runData[0].id)
        .order('net_pay', { ascending: false })
      setPayslips((slips as any) ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function generate() {
    setGenerating(true)
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    const res = await fetch('/api/payroll/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period_start: start, period_end: end }),
    })
    if (res.ok) await load()
    setGenerating(false)
  }

  async function lockPayroll() {
    if (!activeRun) return
    setLocking(true)
    await fetch('/api/payroll/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ run_id: activeRun.id }),
    })
    await load()
    setLocking(false)
  }

  const totalNet = payslips.reduce((s, p) => s + p.net_pay, 0)
  const totalEPF = payslips.reduce((s, p) => s + p.epf_employer, 0)
  const totalSOCSO = payslips.reduce((s, p) => s + p.socso_employer, 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payroll</h1>
          <p className="text-slate-500 text-sm">Paid on the 7th of each month</p>
        </div>
        <Button onClick={generate} disabled={generating} variant="outline">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {generating ? 'Calculating…' : 'Generate / Recalculate'}
        </Button>
      </div>

      {/* Period selector */}
      {runs.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {runs.map((run) => (
            <button
              key={run.id}
              onClick={() => {
                setActiveRun(run)
                supabase
                  .from('payslips')
                  .select('*, drivers(*)')
                  .eq('payroll_run_id', run.id)
                  .then(({ data }) => setPayslips((data as any) ?? []))
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                activeRun?.id === run.id
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {format(new Date(run.period_start), 'MMM yyyy')}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
      ) : !activeRun ? (
        <Card>
          <CardContent className="p-12 text-center text-slate-400">
            <p>No payroll runs yet. Click &ldquo;Generate&rdquo; to calculate this month&apos;s payroll.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-slate-400 mb-1">Total Net Pay</p>
                <p className="text-2xl font-bold text-blue-600">{formatRM(totalNet)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-slate-400 mb-1">EPF Employer</p>
                <p className="text-xl font-bold text-slate-900">{formatRM(totalEPF)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-slate-400 mb-1">SOCSO + EIS Employer</p>
                <p className="text-xl font-bold text-slate-900">{formatRM(totalSOCSO)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            {activeRun.status === 'draft' && (
              <Button onClick={lockPayroll} disabled={locking} variant="destructive">
                {locking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Lock Payroll
              </Button>
            )}
            <a href={`/api/export/bank-transfer?run_id=${activeRun.id}`} download>
              <Button variant="outline">
                <Download className="w-4 h-4" />
                Bank Transfer CSV
              </Button>
            </a>
            <a href={`/api/export/epf-socso?run_id=${activeRun.id}`} download>
              <Button variant="outline">
                <Download className="w-4 h-4" />
                EPF / SOCSO CSV
              </Button>
            </a>
            <a href={`/api/export/payslips?run_id=${activeRun.id}`} download>
              <Button variant="outline">
                <Download className="w-4 h-4" />
                Payslips PDF
              </Button>
            </a>
          </div>

          {/* Payslip table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {format(new Date(activeRun.period_start), 'MMMM yyyy')} — {payslips.length} drivers
              </CardTitle>
              <Badge
                variant={
                  activeRun.status === 'locked'
                    ? 'destructive'
                    : activeRun.status === 'paid'
                      ? 'success'
                      : 'secondary'
                }
              >
                {activeRun.status}
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Driver</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Base</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">OT</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Allow.</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Deduct.</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase font-bold">Net Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payslips.map((ps) => {
                      const deductions = ps.epf_employee + ps.socso_employee + ps.eis_employee
                      return (
                        <tr key={ps.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{ps.drivers?.name}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{formatRM(ps.base_pay)}</td>
                          <td className="px-4 py-3 text-right text-blue-600">{formatRM(ps.ot_pay)}</td>
                          <td className="px-4 py-3 text-right text-green-600">{formatRM(ps.total_allowances)}</td>
                          <td className="px-4 py-3 text-right text-red-500">({formatRM(deductions)})</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">{formatRM(ps.net_pay)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-300 bg-slate-50">
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-700">Total</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatRM(payslips.reduce((s,p)=>s+p.base_pay,0))}</td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-600">{formatRM(payslips.reduce((s,p)=>s+p.ot_pay,0))}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">{formatRM(payslips.reduce((s,p)=>s+p.total_allowances,0))}</td>
                      <td className="px-4 py-3 text-right font-semibold text-red-500">({formatRM(payslips.reduce((s,p)=>s+p.epf_employee+p.socso_employee+p.eis_employee,0))})</td>
                      <td className="px-4 py-3 text-right font-bold text-blue-600 text-base">{formatRM(totalNet)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
