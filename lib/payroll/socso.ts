// SOCSO + EIS contribution (simplified table — exact cents per bracket)
// SOCSO only applies to employees earning ≤ RM4,000/month
// EIS applies to all (0.2% each side, capped at RM4,000)

// Simplified: employee 0.5%, employer 1.75% of insurable wages (capped RM4k)
export function socsoEmployee(wage: number): number {
  if (wage > 4000) return 0
  const insurable = Math.min(wage, 4000)
  return Math.round(insurable * 0.005 * 100) / 100
}

export function socsoEmployer(wage: number): number {
  if (wage > 4000) return 0
  const insurable = Math.min(wage, 4000)
  return Math.round(insurable * 0.0175 * 100) / 100
}

export function eisEmployee(wage: number): number {
  const insurable = Math.min(wage, 4000)
  return Math.round(insurable * 0.002 * 100) / 100
}

export function eisEmployer(wage: number): number {
  const insurable = Math.min(wage, 4000)
  return Math.round(insurable * 0.002 * 100) / 100
}
