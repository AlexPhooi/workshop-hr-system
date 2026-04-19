import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { calculatePayslip } from '@/lib/payroll/calculate'
import { requireBoss } from '@/lib/api-auth'
import { Driver, Attendance, Claim } from '@/lib/types'

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const auth = await requireBoss(supabase)
  if (auth instanceof NextResponse) return auth

  const { period_start, period_end } = await req.json()
  if (!period_start || !period_end)
    return NextResponse.json({ error: 'period_start and period_end required' }, { status: 400 })

  // Basic date format validation to prevent injection into queries
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  if (!datePattern.test(period_start) || !datePattern.test(period_end))
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })

  const { data: run, error: runError } = await supabase
    .from('payroll_runs')
    .upsert({ period_start, period_end, status: 'draft', generated_at: new Date().toISOString() })
    .select()
    .single()

  if (runError) return NextResponse.json({ error: runError.message }, { status: 500 })

  const { data: drivers } = await supabase
    .from('drivers')
    .select('*')
    .eq('is_active', true)

  if (!drivers?.length) return NextResponse.json({ run, payslips: [] })

  const results = await Promise.all(
    drivers.map(async (driver: Driver) => {
      const [{ data: attendance }, { data: claims }] = await Promise.all([
        supabase
          .from('attendance')
          .select('*')
          .eq('driver_id', driver.id)
          .gte('date', period_start)
          .lte('date', period_end),
        supabase
          .from('claims')
          .select('*')
          .eq('driver_id', driver.id)
          .gte('date', period_start)
          .lte('date', period_end)
          .in('status', ['auto_approved', 'approved']),
      ])

      return calculatePayslip(driver, (attendance as Attendance[]) ?? [], (claims as Claim[]) ?? [])
    })
  )

  const payslipRows = results.map((r) => ({ payroll_run_id: run.id, ...r }))

  const { error: slipError } = await supabase
    .from('payslips')
    .upsert(payslipRows, { onConflict: 'payroll_run_id,driver_id' })

  if (slipError) return NextResponse.json({ error: slipError.message }, { status: 500 })

  return NextResponse.json({ run, count: results.length })
}
