import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireBoss, escapeHtml } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const auth = await requireBoss(supabase)
  if (auth instanceof NextResponse) return auth

  const runId = req.nextUrl.searchParams.get('run_id')
  if (!runId) return NextResponse.json({ error: 'run_id required' }, { status: 400 })

  const { data: run } = await supabase
    .from('payroll_runs')
    .select('period_start, period_end')
    .eq('id', runId)
    .single()

  const { data: payslips } = await supabase
    .from('payslips')
    .select('*, drivers(name, ic_number, bank_name, bank_account, pay_type, base_salary, daily_rate, trip_rate)')
    .eq('payroll_run_id', runId)
    .order('net_pay', { ascending: false })

  if (!payslips?.length) return NextResponse.json({ error: 'No payslips found' }, { status: 404 })

  const period = run
    ? new Date(run.period_start).toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })
    : 'Unknown'

  const formatRM = (n: number) => `RM ${n.toFixed(2)}`

  const slipHtml = (payslips ?? []).map((p) => {
    const d = (p as any).drivers
    // All user-supplied strings are HTML-escaped before insertion
    const name = escapeHtml(d?.name)
    const ic = escapeHtml(d?.ic_number)
    const bank = escapeHtml(d?.bank_name)
    const account = escapeHtml(d?.bank_account)
    const payType = escapeHtml(d?.pay_type)

    return `
      <div class="payslip">
        <div class="header">
          <div>
            <h2>ATR Logistics Sdn Bhd</h2>
            <p>Payslip &mdash; ${escapeHtml(period)}</p>
          </div>
        </div>
        <table class="info">
          <tr><td>Name</td><td>${name}</td></tr>
          <tr><td>IC Number</td><td>${ic}</td></tr>
          <tr><td>Bank</td><td>${bank} &mdash; ${account}</td></tr>
          <tr><td>Pay Type</td><td>${payType}</td></tr>
        </table>
        <table class="amounts">
          <thead><tr><th>Description</th><th>Amount</th></tr></thead>
          <tbody>
            <tr><td>Basic Pay</td><td>${formatRM(p.base_pay)}</td></tr>
            <tr><td>Overtime Pay</td><td>${formatRM(p.ot_pay)}</td></tr>
            <tr><td>Allowances</td><td>${formatRM(p.total_allowances)}</td></tr>
            <tr class="subtotal"><td>Gross Pay</td><td>${formatRM(p.gross_pay)}</td></tr>
            <tr class="deduct"><td>EPF (Employee 11%)</td><td>(${formatRM(p.epf_employee)})</td></tr>
            <tr class="deduct"><td>SOCSO</td><td>(${formatRM(p.socso_employee)})</td></tr>
            <tr class="deduct"><td>EIS</td><td>(${formatRM(p.eis_employee)})</td></tr>
            <tr class="net"><td>Net Pay</td><td>${formatRM(p.net_pay)}</td></tr>
          </tbody>
        </table>
        <p class="note">Employer contributions: EPF ${formatRM(p.epf_employer)} &middot; SOCSO ${formatRM(p.socso_employer)} &middot; EIS ${formatRM(p.eis_employer)}</p>
      </div>
    `
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Payslips &mdash; ${escapeHtml(period)}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; background: white; }
  .payslip { page-break-after: always; padding: 32px; border: 1px solid #e2e8f0; margin: 16px; border-radius: 8px; }
  .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px; }
  .header h2 { margin: 0; font-size: 16px; color: #1e40af; }
  .header p { margin: 4px 0 0; color: #64748b; }
  table.info { width: 100%; margin-bottom: 16px; }
  table.info td { padding: 3px 8px; }
  table.info td:first-child { color: #64748b; width: 120px; }
  table.amounts { width: 100%; border-collapse: collapse; }
  table.amounts th { background: #f8fafc; padding: 6px 8px; text-align: left; border-bottom: 1px solid #e2e8f0; }
  table.amounts td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
  table.amounts td:last-child { text-align: right; }
  .subtotal td { font-weight: bold; border-top: 2px solid #e2e8f0; background: #f8fafc; }
  .deduct td { color: #dc2626; }
  .net td { font-weight: bold; font-size: 14px; color: #2563eb; border-top: 2px solid #2563eb; }
  .note { margin-top: 12px; color: #64748b; font-size: 11px; }
  @media print { .payslip { margin: 0; border: none; } }
</style>
</head>
<body>
${slipHtml}
<script>window.onload = () => window.print()</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
