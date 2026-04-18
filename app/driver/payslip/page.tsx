export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import PayslipCard from '@/components/driver/PayslipCard'
import { format } from 'date-fns'

export default async function PayslipPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('driver_id').eq('id', user.id).single()
  const driverId = profile!.driver_id

  const [{ data: driver }, { data: payslips }] = await Promise.all([
    supabase.from('drivers').select('*').eq('id', driverId).single(),
    supabase
      .from('payslips')
      .select('*, payroll_runs(period_start, period_end, status)')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4">
        <h1 className="text-xl font-bold text-slate-900">Payslips</h1>
        <p className="text-sm text-slate-500">Your last 6 months</p>
      </div>

      {!payslips?.length ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-400">
            No payslips generated yet. Check back after payroll day.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payslips.map((ps) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const run = (ps as any).payroll_runs
            const period = run
              ? `${format(new Date(run.period_start), 'MMM yyyy')}`
              : 'Unknown'
            return (
              <PayslipCard
                key={ps.id}
                payslip={ps}
                driver={driver!}
                period={period}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
