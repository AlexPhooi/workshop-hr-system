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
    .select('net_pay, drivers(name, bank_name, bank_account, ic_number)')
    .eq('payroll_run_id', runId)
    .order('net_pay', { ascending: false })

  const rows = [
    'No,Name,IC Number,Bank,Account Number,Amount (RM)',
    ...(payslips ?? []).map((p, i) => {
      const d = (p as any).drivers
      return [
        i + 1,
        safeCsvField(d?.name),
        safeCsvField(d?.ic_number),
        safeCsvField(d?.bank_name),
        safeCsvField(d?.bank_account),
        safeCsvField(p.net_pay.toFixed(2)),
      ].map((f) => `"${String(f).replace(/"/g, '""')}"`).join(',')
    }),
  ]

  return new NextResponse(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="bank-transfer-${runId}.csv"`,
    },
  })
}
