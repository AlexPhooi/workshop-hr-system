export type PayType = 'monthly' | 'daily' | 'trip'
export type DayType = 'normal' | 'rest' | 'public_holiday'
export type ClaimType = 'toll' | 'fuel' | 'outstation' | 'meal' | 'telco'
export type ClaimStatus = 'auto_approved' | 'pending' | 'approved' | 'rejected'
export type PayrollStatus = 'draft' | 'locked' | 'paid'
export type UserRole = 'driver' | 'boss'

export interface Driver {
  id: string
  name: string
  ic_number: string
  phone: string
  email: string | null
  bank_name: string
  bank_account: string
  pay_type: PayType
  base_salary: number | null
  daily_rate: number | null
  trip_rate: number | null
  state: string
  telco_allowance: number
  meal_per_day: number
  fuel_cap: number | null
  toll_cap: number | null
  outstation_rate: number
  epf_eligible: boolean
  socso_eligible: boolean
  is_active: boolean
  created_at: string
}

export interface Attendance {
  id: string
  driver_id: string
  date: string
  clock_in_at: string | null
  clock_in_lat: number | null
  clock_in_lng: number | null
  clock_out_at: string | null
  clock_out_lat: number | null
  clock_out_lng: number | null
  hours_worked: number | null
  ot_hours: number | null
  day_type: DayType
}

export interface Claim {
  id: string
  driver_id: string
  date: string
  type: ClaimType
  amount: number
  receipt_url: string | null
  notes: string | null
  status: ClaimStatus
  approved_by: string | null
  approved_at: string | null
  created_at: string
  drivers?: { name: string }
}

export interface PayrollRun {
  id: string
  period_start: string
  period_end: string
  status: PayrollStatus
  generated_at: string | null
}

export interface Payslip {
  id: string
  payroll_run_id: string
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
  drivers?: Driver
}

export interface PublicHoliday {
  id: string
  date: string
  name: string
  state: string | null
}

export interface Profile {
  id: string
  role: UserRole
  driver_id: string | null
}
