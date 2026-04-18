import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRM, currentMonthRange } from '@/lib/utils'
import { Users, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function BossDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'boss') redirect('/driver/dashboard')

  const today = new Date().toISOString().split('T')[0]
  const { start, end } = currentMonthRange()

  const [
    { data: drivers },
    { data: todayAtt },
    { data: pendingClaims },
    { data: monthPayslips },
    { data: monthClaims },
  ] = await Promise.all([
    supabase.from('drivers').select('id, name').eq('is_active', true),
    supabase.from('attendance').select('driver_id, clock_in_at, clock_out_at').eq('date', today),
    supabase.from('claims').select('id, amount, type, drivers(name)').eq('status', 'pending'),
    supabase.from('payslips').select('net_pay, payroll_run_id').gte('created_at', start + 'T00:00:00'),
    supabase.from('claims').select('amount, status').gte('date', start).lte('date', end),
  ])

  const totalDrivers = drivers?.length ?? 0
  const clockedInIds = new Set((todayAtt ?? []).filter((a) => a.clock_in_at && !a.clock_out_at).map((a) => a.driver_id))
  const clockedIn = clockedInIds.size
  const clockedOut = (todayAtt ?? []).filter((a) => a.clock_out_at).length
  const notIn = totalDrivers - (todayAtt ?? []).length

  const totalPayroll = (monthPayslips ?? []).reduce((s, p) => s + p.net_pay, 0)
  const approvedClaims = (monthClaims ?? [])
    .filter((c) => c.status === 'auto_approved' || c.status === 'approved')
    .reduce((s, c) => s + c.amount, 0)

  // Top OT drivers this month
  const { data: otData } = await supabase
    .from('attendance')
    .select('driver_id, ot_hours, drivers(name)')
    .gte('date', start)
    .lte('date', end)
    .gt('ot_hours', 0)

  const otByDriver = new Map<string, { name: string; hours: number }>()
  for (const row of otData ?? []) {
    const existing = otByDriver.get(row.driver_id)
    // @ts-expect-error join
    const name = row.drivers?.name ?? row.driver_id
    otByDriver.set(row.driver_id, {
      name,
      hours: (existing?.hours ?? 0) + (row.ot_hours ?? 0),
    })
  }
  const topOT = [...otByDriver.values()].sort((a, b) => b.hours - a.hours).slice(0, 5)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Good {greeting()}</h1>
        <p className="text-slate-500 text-sm">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{clockedIn}</p>
                <p className="text-xs text-slate-500">Clocked In</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{notIn}</p>
                <p className="text-xs text-slate-500">Not In Yet</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${(pendingClaims?.length ?? 0) > 0 ? 'bg-yellow-100' : 'bg-slate-100'}`}>
                <AlertCircle className={`w-5 h-5 ${(pendingClaims?.length ?? 0) > 0 ? 'text-yellow-600' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{pendingClaims?.length ?? 0}</p>
                <p className="text-xs text-slate-500">Pending Claims</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{formatRM(totalPayroll || approvedClaims)}</p>
                <p className="text-xs text-slate-500">Month Liability</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Attendance ({format(new Date(), 'd MMM')})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {drivers?.slice(0, 8).map((driver) => {
                const att = (todayAtt ?? []).find((a) => a.driver_id === driver.id)
                const status = !att
                  ? 'absent'
                  : att.clock_out_at
                    ? 'done'
                    : att.clock_in_at
                      ? 'in'
                      : 'absent'
                return (
                  <div key={driver.id} className="flex items-center justify-between px-6 py-3">
                    <span className="text-sm text-slate-700">{driver.name}</span>
                    <Badge
                      variant={
                        status === 'in' ? 'success' : status === 'done' ? 'secondary' : 'destructive'
                      }
                    >
                      {status === 'in' ? 'Clocked In' : status === 'done' ? 'Done' : 'Absent'}
                    </Badge>
                  </div>
                )
              })}
            </div>
            {(drivers?.length ?? 0) > 8 && (
              <div className="px-6 py-3 border-t">
                <Link href="/boss/drivers" className="text-sm text-blue-600 hover:underline">
                  View all {drivers?.length} drivers →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending claims */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending Claims</CardTitle>
            {(pendingClaims?.length ?? 0) > 0 && (
              <Link href="/boss/claims" className="text-sm text-blue-600 hover:underline">
                Review all →
              </Link>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {!pendingClaims?.length ? (
              <p className="px-6 py-8 text-center text-slate-400 text-sm">All claims reviewed.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingClaims.slice(0, 6).map((claim) => (
                  <div key={claim.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      {/* @ts-expect-error join */}
                      <p className="text-sm font-medium text-slate-700">{claim.drivers?.name}</p>
                      <p className="text-xs text-slate-400 capitalize">{claim.type}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{formatRM(claim.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* OT leaderboard */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>OT Leaderboard — {format(new Date(), 'MMMM yyyy')}</CardTitle>
          </CardHeader>
          <CardContent>
            {!topOT.length ? (
              <p className="text-slate-400 text-sm text-center py-4">No OT recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {topOT.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-400 w-5">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-sm text-slate-700">{d.name}</span>
                        <span className="text-sm font-semibold text-slate-900">{d.hours.toFixed(1)} hrs</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min(100, (d.hours / (topOT[0]?.hours || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
