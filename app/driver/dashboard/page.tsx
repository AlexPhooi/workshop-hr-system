import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatRM, currentMonthRange, formatTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Clock, FileText, TrendingUp, CheckCircle, XCircle } from 'lucide-react'

export default async function DriverDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('driver_id')
    .eq('id', user.id)
    .single()

  if (!profile?.driver_id) redirect('/login')

  const driverId = profile.driver_id
  const today = new Date().toISOString().split('T')[0]
  const { start, end } = currentMonthRange()

  const [{ data: driver }, { data: todayAtt }, { data: monthAtt }, { data: claims }] =
    await Promise.all([
      supabase.from('drivers').select('name, base_salary, pay_type').eq('id', driverId).single(),
      supabase.from('attendance').select('*').eq('driver_id', driverId).eq('date', today).maybeSingle(),
      supabase.from('attendance').select('ot_hours, hours_worked').eq('driver_id', driverId).gte('date', start).lte('date', end),
      supabase.from('claims').select('amount, status, type').eq('driver_id', driverId).gte('date', start).lte('date', end),
    ])

  const totalOT = (monthAtt ?? []).reduce((s, a) => s + (a.ot_hours ?? 0), 0)
  const daysWorked = (monthAtt ?? []).filter((a) => (a.hours_worked ?? 0) > 0).length
  const approvedClaims = (claims ?? [])
    .filter((c) => c.status === 'auto_approved' || c.status === 'approved')
    .reduce((s, c) => s + c.amount, 0)
  const pendingClaims = (claims ?? []).filter((c) => c.status === 'pending').length

  const isClockedIn = todayAtt?.clock_in_at && !todayAtt?.clock_out_at

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="pt-4">
        <p className="text-slate-500 text-sm">Good {greeting()}</p>
        <h1 className="text-2xl font-bold text-slate-900">{driver?.name ?? 'Driver'}</h1>
      </div>

      {/* Clock status */}
      <Card className={isClockedIn ? 'border-green-200 bg-green-50' : 'border-slate-200'}>
        <CardContent className="p-4 flex items-center gap-3">
          {isClockedIn ? (
            <CheckCircle className="w-8 h-8 text-green-600 shrink-0" />
          ) : (
            <XCircle className="w-8 h-8 text-slate-300 shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-semibold text-slate-900">
              {isClockedIn ? 'Clocked In' : todayAtt?.clock_out_at ? 'Clocked Out' : 'Not clocked in'}
            </p>
            {todayAtt?.clock_in_at && (
              <p className="text-sm text-slate-500">
                In: {formatTime(todayAtt.clock_in_at)}
                {todayAtt.clock_out_at && ` · Out: ${formatTime(todayAtt.clock_out_at)}`}
              </p>
            )}
          </div>
          <Link
            href="/driver/clock"
            className="text-sm font-medium text-blue-600 hover:underline shrink-0"
          >
            {isClockedIn ? 'Clock Out' : 'Clock In'}
          </Link>
        </CardContent>
      </Card>

      {/* This month summary */}
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
        This Month
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 mb-1">Days Worked</p>
            <p className="text-2xl font-bold text-slate-900">{daysWorked}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 mb-1">OT Hours</p>
            <p className="text-2xl font-bold text-blue-600">{totalOT.toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 mb-1">Claims Approved</p>
            <p className="text-xl font-bold text-green-600">{formatRM(approvedClaims)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">Pending Claims</p>
              <p className="text-2xl font-bold text-slate-900">{pendingClaims}</p>
            </div>
            {pendingClaims > 0 && <Badge variant="warning">{pendingClaims}</Badge>}
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/driver/claims/new"
          className="flex items-center gap-2 p-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          <FileText className="w-4 h-4" />
          Submit Claim
        </Link>
        <Link
          href="/driver/payslip"
          className="flex items-center gap-2 p-4 rounded-xl bg-white border border-slate-200 text-slate-900 font-medium hover:bg-slate-50 transition-colors"
        >
          <TrendingUp className="w-4 h-4" />
          View Payslip
        </Link>
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
