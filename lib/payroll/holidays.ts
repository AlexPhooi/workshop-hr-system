// Malaysian public holidays 2024-2026 (national only — state holidays added via DB)
export const NATIONAL_HOLIDAYS_2024 = [
  '2024-01-01', // New Year's Day
  '2024-02-01', // Federal Territory Day (KL/Putrajaya/Labuan)
  '2024-02-10', // Chinese New Year
  '2024-02-11', // Chinese New Year (2nd day)
  '2024-04-10', // Hari Raya Aidilfitri
  '2024-04-11', // Hari Raya Aidilfitri (2nd day)
  '2024-05-01', // Labour Day
  '2024-05-23', // Wesak Day
  '2024-06-17', // Hari Raya Aidiladha
  '2024-06-22', // Yang di-Pertuan Agong's Birthday
  '2024-07-07', // Awal Muharram
  '2024-08-31', // National Day
  '2024-09-16', // Malaysia Day
  '2024-09-16', // Prophet Muhammad's Birthday
  '2024-10-31', // Deepavali
  '2024-12-25', // Christmas Day
]

export const NATIONAL_HOLIDAYS_2025 = [
  '2025-01-01', // New Year's Day
  '2025-01-29', // Chinese New Year
  '2025-01-30', // Chinese New Year (2nd day)
  '2025-03-31', // Hari Raya Aidilfitri
  '2025-04-01', // Hari Raya Aidilfitri (2nd day)
  '2025-05-01', // Labour Day
  '2025-05-12', // Wesak Day
  '2025-06-06', // Yang di-Pertuan Agong's Birthday
  '2025-06-07', // Hari Raya Aidiladha
  '2025-06-27', // Awal Muharram
  '2025-08-31', // National Day
  '2025-09-05', // Prophet Muhammad's Birthday
  '2025-09-16', // Malaysia Day
  '2025-10-20', // Deepavali
  '2025-12-25', // Christmas Day
]

export const NATIONAL_HOLIDAYS_2026 = [
  '2026-01-01', // New Year's Day
  '2026-02-17', // Chinese New Year
  '2026-02-18', // Chinese New Year (2nd day)
  '2026-03-20', // Hari Raya Aidilfitri
  '2026-03-21', // Hari Raya Aidilfitri (2nd day)
  '2026-05-01', // Labour Day
  '2026-05-31', // Wesak Day
  '2026-05-27', // Hari Raya Aidiladha
  '2026-06-01', // Yang di-Pertuan Agong's Birthday
  '2026-06-16', // Awal Muharram
  '2026-08-31', // National Day
  '2026-08-25', // Prophet Muhammad's Birthday
  '2026-09-16', // Malaysia Day
  '2026-11-08', // Deepavali
  '2026-12-25', // Christmas Day
]

const ALL_NATIONAL: Set<string> = new Set([
  ...NATIONAL_HOLIDAYS_2024,
  ...NATIONAL_HOLIDAYS_2025,
  ...NATIONAL_HOLIDAYS_2026,
])

export function isNationalHoliday(dateStr: string): boolean {
  return ALL_NATIONAL.has(dateStr)
}

// Returns true if the date is the 7th day of the week cycle for the driver
// (rest day = every 7th consecutive day). For simplicity, Sunday = rest day.
export function isRestDay(dateStr: string): boolean {
  const day = new Date(dateStr).getDay()
  return day === 0 // Sunday
}
