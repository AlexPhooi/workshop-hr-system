import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireBoss, safeCsvField } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  const supabase = await createServiceClient()
  const auth = await requireBoss(supabase)
  if (auth instanceof NextResponse) return auth

  const runId = req.nextUrl.searchParams.get('run_id')
  if (!runId) return NextResponse.json({ error: 'run_id required' }, { status: 400 })

  const { data: payslips } = await supabase
    .from('payslips')
    .select('*, drivers(name, ic_number, epf_eligible, socso_eligible)')
    .eq('payroll_run_id', runId)
    .order('net_pay', { ascending: false })

  const rows = [
    'No,Name,IC Number,EPF Employee,EPF Employer,SOCSO Employee,SOCSO Employer,EIS Employee,EIS Employer',
    ...(payslips ?? []).map((p, i) => {
      const d = (p as any).drivers
      return [
        i + 1,
        safeCsvField(d?.name),
        safeCsvField(d?.ic_number),
        safeCsvField(p.epf_employee.toFixed(2)),
        safeCsvField(p.epf_employer.toFixed(2)),
        safeCsvField(p.socso_employee.toFixed(2)),
        safeCsvField(p.socso_employer.toFixed(2)),
        safeCsvField(p.eis_employee.toFixed(2)),
        safeCsvField(p.eis_employer.toFixed(2)),
      ].map((f) => `"${String(f).replace(/"/g, '""')}"`).join(',')
    }),
  ]

  return new NextResponse(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="epf-socso-${runId}.csv"`,
    },
  })
}
