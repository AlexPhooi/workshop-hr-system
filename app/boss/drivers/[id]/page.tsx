export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRM, formatDate, formatTime, currentMonthRange } from '@/lib/utils'
import Link from 'next/link'
import { ChevronLeft, Phone, CreditCard } from 'lucide-react'
import { ClaimStatus } from '@/lib/types'

const statusVariants: Record<ClaimStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  auto_approved: 'success',
  approved: 'success',
  pending: 'warning',
  rejected: 'destructive',
}

export default async function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { start, end } = currentMonthRange()

  const [{ data: driver }, { data: attendance }, { data: claims }] = await Promise.all([
    supabase.from('drivers').select('*').eq('id', id).single(),
    supabase.from('attendance').select('*').eq('driver_id', id).gte('date', start).lte('date', end).order('date', { ascending: false }),
    supabase.from('claims').select('*').eq('driver_id', id).gte('date', start).lte('date', end).order('date', { ascending: false }),
  ])

  if (!driver) redirect('/boss/drivers')

  const totalOT = (attendance ?? []).reduce((s, a) => s + (a.ot_hours ?? 0), 0)
  const daysWorked = (attendance ?? []).filter((a) => (a.hours_worked ?? 0) > 0).length
  const approvedClaims = (claims ?? [])
    .filter((c) => c.status === 'auto_approved' || c.status === 'approved')
    .reduce((s, c) => s + c.amount, 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/boss/drivers" className="text-slate-400 hover:text-slate-600">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{driver.name}</h1>
          <p className="text-slate-500 text-sm capitalize">{driver.pay_type} rate</p>
        </div>
        <Link href={`/boss/drivers/${id}/edit`} className="ml-auto text-sm text-blue-600 hover:underline">
          Edit
        </Link>
      </div>

      {/* Info cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone className="w-4 h-4" /> {driver.phone}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CreditCard className="w-4 h-4" /> {driver.bank_name} · {driver.bank_account}
            </div>
            <div className="text-xs text-slate-400">IC: {driver.ic_number}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 mb-1">Base Pay</p>
            <p className="text-xl font-bold text-slate-900">
              {driver.pay_type === 'monthly'
                ? formatRM(driver.base_salary ?? 0) + '/mo'
                : driver.pay_type === 'daily'
                  ? formatRM(driver.daily_rate ?? 0) + '/day'
                  : formatRM(driver.trip_rate ?? 0) + '/trip'}
            </p>
            <div className="flex gap-3 mt-2">
              {driver.epf_eligible && <Badge variant="secondary">EPF</Badge>}
              {driver.socso_eligible && <Badge variant="secondary">SOCSO</Badge>}
              <Badge variant="secondary">EIS</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Month summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{daysWorked}</p>
            <p className="text-xs text-slate-500 mt-0.5">Days Worked</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{totalOT.toFixed(1)}</p>
            <p className="text-xs text-slate-500 mt-0.5">OT Hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold text-green-600">{formatRM(approvedClaims)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Claims</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance log */}
      <Card>
        <CardHeader><CardTitle>Attendance Log</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {attendance?.slice(0, 10).map((att) => (
              <div key={att.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">{formatDate(att.date)}</p>
                  {att.clock_in_at && (
                    <p className="text-xs text-slate-400">
                      {formatTime(att.clock_in_at)}
                      {att.clock_out_at && ` → ${formatTime(att.clock_out_at)}`}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-700">{att.hours_worked?.toFixed(1) ?? '—'} hrs</p>
                  {(att.ot_hours ?? 0) > 0 && (
                    <p className="text-xs text-blue-600">+{att.ot_hours?.toFixed(1)} OT</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Claims */}
      <Card>
        <CardHeader><CardTitle>Claims This Month</CardTitle></CardHeader>
        <CardContent className="p-0">
          {!claims?.length ? (
            <p className="px-6 py-6 text-slate-400 text-sm text-center">No claims.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {claims.map((claim) => (
                <div key={claim.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700 capitalize">{claim.type}</p>
                    <p className="text-xs text-slate-400">{formatDate(claim.date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={statusVariants[claim.status as ClaimStatus]}>
                      {claim.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm font-semibold text-slate-900">{formatRM(claim.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
