import { Payslip, Driver } from '@/lib/types'
import { formatRM } from '@/lib/utils'

interface Props {
  payslip: Payslip
  driver: Driver
  period: string
}

interface Row { label: string; value: number; highlight?: boolean }

export default function PayslipCard({ payslip, driver, period }: Props) {
  const earnings: Row[] = [
    { label: 'Basic Pay', value: payslip.base_pay },
    { label: 'Overtime Pay', value: payslip.ot_pay },
    { label: 'Allowances', value: payslip.total_allowances },
  ]

  const deductions: Row[] = [
    { label: 'EPF (Employee 11%)', value: payslip.epf_employee },
    { label: 'SOCSO', value: payslip.socso_employee },
    { label: 'EIS', value: payslip.eis_employee },
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header strip */}
      <div className="bg-blue-600 text-white p-5">
        <p className="text-xs opacity-70 uppercase tracking-wide">Payslip</p>
        <p className="text-lg font-bold mt-0.5">{driver.name}</p>
        <p className="text-sm opacity-80 mt-0.5">{period}</p>
      </div>

      <div className="p-5 space-y-4">
        {/* Earnings */}
        <section>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Earnings</p>
          {earnings.map((r) => (
            <div key={r.label} className="flex justify-between py-1.5 border-b border-slate-50 last:border-0">
              <span className="text-sm text-slate-600">{r.label}</span>
              <span className="text-sm font-medium text-slate-900">{formatRM(r.value)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2">
            <span className="text-sm font-semibold text-slate-700">Gross Pay</span>
            <span className="text-sm font-bold text-slate-900">{formatRM(payslip.gross_pay)}</span>
          </div>
        </section>

        {/* Deductions */}
        <section>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Deductions</p>
          {deductions.map((r) => (
            <div key={r.label} className="flex justify-between py-1.5 border-b border-slate-50 last:border-0">
              <span className="text-sm text-slate-600">{r.label}</span>
              <span className="text-sm text-red-600">({formatRM(r.value)})</span>
            </div>
          ))}
        </section>

        {/* Employer contributions note */}
        <section className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 space-y-1">
          <p className="font-medium text-slate-600">Employer Contributions (not deducted from your pay)</p>
          <div className="flex justify-between"><span>EPF Employer</span><span>{formatRM(payslip.epf_employer)}</span></div>
          <div className="flex justify-between"><span>SOCSO Employer</span><span>{formatRM(payslip.socso_employer)}</span></div>
          <div className="flex justify-between"><span>EIS Employer</span><span>{formatRM(payslip.eis_employer)}</span></div>
        </section>

        {/* Net pay */}
        <div className="flex justify-between items-center pt-1 border-t border-slate-200">
          <span className="font-bold text-slate-900">Net Pay</span>
          <span className="text-2xl font-bold text-blue-600">{formatRM(payslip.net_pay)}</span>
        </div>
      </div>
    </div>
  )
}
