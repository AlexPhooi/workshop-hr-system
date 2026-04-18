export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AttendanceCalendar from '@/components/driver/AttendanceCalendar'
import { currentMonthRange } from '@/lib/utils'
import { format } from 'date-fns'

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('driver_id').eq('id', user.id).single()
  const { start, end } = currentMonthRange()

  const [{ data: attendance }, { data: holidays }] = await Promise.all([
    supabase.from('attendance').select('*').eq('driver_id', profile!.driver_id).gte('date', start).lte('date', end),
    supabase.from('public_holidays').select('date').gte('date', start).lte('date', end),
  ])

  const daysPresent = (attendance ?? []).filter((a) => (a.hours_worked ?? 0) >= 4).length
  const totalOT = (attendance ?? []).reduce((s, a) => s + (a.ot_hours ?? 0), 0)
  const holidayDates = (holidays ?? []).map((h) => h.date)

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4">
        <h1 className="text-xl font-bold text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500">{format(new Date(), 'MMMM yyyy')}</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{daysPresent}</p>
            <p className="text-xs text-slate-500 mt-0.5">Days Present</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{totalOT.toFixed(1)}</p>
            <p className="text-xs text-slate-500 mt-0.5">OT Hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-slate-700">{holidayDates.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Public Hols</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceCalendar
            month={new Date()}
            attendance={attendance ?? []}
            holidays={holidayDates}
          />
        </CardContent>
      </Card>
    </div>
  )
}
