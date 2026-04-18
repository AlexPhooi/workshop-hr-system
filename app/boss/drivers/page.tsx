import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRM, currentMonthRange } from '@/lib/utils'
import Link from 'next/link'
import { Plus, ChevronRight } from 'lucide-react'

export default async function DriversPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { start, end } = currentMonthRange()
  const today = new Date().toISOString().split('T')[0]

  const [{ data: drivers }, { data: todayAtt }, { data: monthAtt }] = await Promise.all([
    supabase.from('drivers').select('*').eq('is_active', true).order('name'),
    supabase.from('attendance').select('driver_id, clock_in_at, clock_out_at').eq('date', today),
    supabase.from('attendance').select('driver_id, ot_hours').gte('date', start).lte('date', end),
  ])

  const attMap = new Map((todayAtt ?? []).map((a) => [a.driver_id, a]))
  const otMap = new Map<string, number>()
  for (const row of monthAtt ?? []) {
    otMap.set(row.driver_id, (otMap.get(row.driver_id) ?? 0) + (row.ot_hours ?? 0))
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Drivers</h1>
          <p className="text-slate-500 text-sm">{drivers?.length ?? 0} active drivers</p>
        </div>
        <Link href="/boss/drivers/new">
          <Button>
            <Plus className="w-4 h-4" />
            Add Driver
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Driver</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Pay Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Today</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">OT Hrs</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {drivers?.map((driver) => {
              const att = attMap.get(driver.id)
              const status = !att
                ? 'absent'
                : att.clock_out_at
                  ? 'done'
                  : att.clock_in_at
                    ? 'in'
                    : 'absent'
              const otHours = otMap.get(driver.id) ?? 0

              return (
                <tr key={driver.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{driver.name}</p>
                      <p className="text-xs text-slate-400">{driver.phone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-sm text-slate-600 capitalize">{driver.pay_type}</span>
                    <p className="text-xs text-slate-400">
                      {driver.pay_type === 'monthly'
                        ? formatRM(driver.base_salary ?? 0)
                        : driver.pay_type === 'daily'
                          ? `${formatRM(driver.daily_rate ?? 0)}/day`
                          : `${formatRM(driver.trip_rate ?? 0)}/trip`}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={status === 'in' ? 'success' : status === 'done' ? 'secondary' : 'destructive'}
                    >
                      {status === 'in' ? 'In' : status === 'done' ? 'Done' : 'Absent'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    <span className={`text-sm font-medium ${otHours > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                      {otHours.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/boss/drivers/${driver.id}`}>
                      <ChevronRight className="w-4 h-4 text-slate-400 hover:text-slate-600 inline-block" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
