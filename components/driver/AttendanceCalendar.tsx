'use client'

import { Attendance } from '@/lib/types'
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  isSameDay,
  isToday,
} from 'date-fns'

interface Props {
  month: Date
  attendance: Attendance[]
  holidays: string[]
}

export default function AttendanceCalendar({ month, attendance, holidays }: Props) {
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  const days = eachDayOfInterval({ start, end })
  const firstDow = getDay(start) // 0=Sun

  function getDayStatus(day: Date) {
    const dateStr = format(day, 'yyyy-MM-dd')
    const record = attendance.find((a) => a.date === dateStr)
    const isHoliday = holidays.includes(dateStr)

    if (isHoliday) return 'holiday'
    if (!record?.clock_in_at) return 'absent'
    if ((record.hours_worked ?? 0) < 4) return 'half'
    return 'present'
  }

  const statusStyles: Record<string, string> = {
    present: 'bg-green-100 text-green-800 font-semibold',
    half: 'bg-orange-100 text-orange-700',
    absent: 'bg-red-50 text-red-400',
    holiday: 'bg-blue-100 text-blue-700',
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 text-center text-xs text-slate-400 font-medium">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {/* Leading empty cells */}
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const status = getDayStatus(day)
          const today = isToday(day)
          return (
            <div
              key={day.toISOString()}
              className={`
                aspect-square rounded-lg flex items-center justify-center text-sm
                ${statusStyles[status]}
                ${today ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
              `}
            >
              {format(day, 'd')}
            </div>
          )
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 inline-block" />Present</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-200 inline-block" />Half-day</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block" />Absent</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-200 inline-block" />Holiday</span>
      </div>
    </div>
  )
}
