import { Driver, Attendance, Claim } from '@/lib/types'
import { epfEmployee, epfEmployer } from './epf'
import { socsoEmployee, socsoEmployer, eisEmployee, eisEmployer } from './socso'

const NORMAL_HOURS = 8
const WORKING_DAYS_PER_MONTH = 26 // Malaysian Labour Act standard

export interface PayslipResult {
  driver_id: string
  base_pay: number
  ot_pay: number
  total_allowances: number
  epf_employee: number
  epf_employer: number
  socso_employee: number
  socso_employer: number
  eis_employee: number
  eis_employer: number
  gross_pay: number
  net_pay: number
}

export function calculatePayslip(
  driver: Driver,
  attendance: Attendance[],
  claims: Claim[]
): PayslipResult {
  let base_pay = 0
  let ot_pay = 0

  if (driver.pay_type === 'monthly' && driver.base_salary) {
    base_pay = driver.base_salary
    const hourlyRate = driver.base_salary / WORKING_DAYS_PER_MONTH / NORMAL_HOURS

    for (const att of attendance) {
      if (!att.hours_worked) continue

      if (att.day_type === 'public_holiday') {
        // Basic day pay already in base_pay; add 2× for all hours worked
        ot_pay += att.hours_worked * hourlyRate * 2
      } else if (att.day_type === 'rest') {
        // Rest day: if < 4 hrs → half-day; else full-day (deducted from base)
        // OT above 8hrs on rest day = 2× hourly
        const dayRate = driver.base_salary / WORKING_DAYS_PER_MONTH
        if (att.hours_worked < 4) {
          ot_pay += dayRate * 0.5
        } else {
          ot_pay += dayRate
        }
        if (att.ot_hours && att.ot_hours > 0) {
          ot_pay += att.ot_hours * hourlyRate * 2
        }
      } else {
        // Normal day OT
        if (att.ot_hours && att.ot_hours > 0) {
          ot_pay += att.ot_hours * hourlyRate * 1.5
        }
      }
    }
  } else if (driver.pay_type === 'daily' && driver.daily_rate) {
    const daysWorked = attendance.filter(
      (a) => a.hours_worked && a.hours_worked > 0 && a.day_type === 'normal'
    ).length
    base_pay = daysWorked * driver.daily_rate

    const hourlyRate = driver.daily_rate / NORMAL_HOURS
    for (const att of attendance) {
      if (!att.hours_worked) continue
      if (att.day_type === 'public_holiday') {
        ot_pay += att.hours_worked * hourlyRate * 2
      } else if (att.day_type === 'rest') {
        ot_pay += driver.daily_rate
        if (att.ot_hours && att.ot_hours > 0) {
          ot_pay += att.ot_hours * hourlyRate * 2
        }
      } else if (att.ot_hours && att.ot_hours > 0) {
        ot_pay += att.ot_hours * hourlyRate * 1.5
      }
    }
  } else if (driver.pay_type === 'trip' && driver.trip_rate) {
    // For trip-based: count completed trips from claims or attendance metadata
    // Using attendance count as proxy for trips
    base_pay = attendance.length * driver.trip_rate
  }

  // Allowances from approved claims
  const approvedClaims = claims.filter(
    (c) => c.status === 'auto_approved' || c.status === 'approved'
  )
  const claimTotal = approvedClaims.reduce((sum, c) => sum + c.amount, 0)

  // Fixed telco allowance
  const telcoTotal = driver.telco_allowance ?? 50

  // Meal allowance per day worked
  const daysPresent = attendance.filter((a) => a.hours_worked && a.hours_worked > 0).length
  const mealTotal = daysPresent * (driver.meal_per_day ?? 10)

  const total_allowances = claimTotal + telcoTotal + mealTotal

  const grossWage = base_pay + ot_pay

  const epf_emp = driver.epf_eligible ? epfEmployee(grossWage) : 0
  const epf_er = driver.epf_eligible ? epfEmployer(grossWage) : 0
  const socso_emp = driver.socso_eligible ? socsoEmployee(grossWage) : 0
  const socso_er = driver.socso_eligible ? socsoEmployer(grossWage) : 0
  const eis_emp = eisEmployee(grossWage)
  const eis_er = eisEmployer(grossWage)

  const gross_pay = grossWage + total_allowances
  const net_pay = gross_pay - epf_emp - socso_emp - eis_emp

  return {
    driver_id: driver.id,
    base_pay: round2(base_pay),
    ot_pay: round2(ot_pay),
    total_allowances: round2(total_allowances),
    epf_employee: epf_emp,
    epf_employer: epf_er,
    socso_employee: socso_emp,
    socso_employer: socso_er,
    eis_employee: eis_emp,
    eis_employer: eis_er,
    gross_pay: round2(gross_pay),
    net_pay: round2(net_pay),
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function computeAttendanceHours(
  clockInAt: string,
  clockOutAt: string
): { hours_worked: number; ot_hours: number } {
  const diff =
    (new Date(clockOutAt).getTime() - new Date(clockInAt).getTime()) / 3600000
  const hours_worked = Math.max(0, round2(diff))
  const ot_hours = round2(Math.max(0, hours_worked - NORMAL_HOURS))
  return { hours_worked, ot_hours }
}
