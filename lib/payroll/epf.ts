// EPF contribution rates per Malaysian EPF Act
// Employee: 11% of wages
// Employer: 13% if wages ≤ RM5,000, else 12%

export function epfEmployee(grossWage: number): number {
  return Math.round(grossWage * 0.11 * 100) / 100
}

export function epfEmployer(grossWage: number): number {
  const rate = grossWage <= 5000 ? 0.13 : 0.12
  return Math.round(grossWage * rate * 100) / 100
}
