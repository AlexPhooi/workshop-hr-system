'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Attendance } from '@/lib/types'
import { formatTime } from '@/lib/utils'
import { MapPin, Loader2 } from 'lucide-react'

interface Props {
  todayRecord: Attendance | null
}

export default function ClockButton({ todayRecord }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locationLabel, setLocationLabel] = useState('')

  const isClockedIn = todayRecord?.clock_in_at && !todayRecord?.clock_out_at
  const isDone = todayRecord?.clock_out_at

  async function handleClock() {
    setLoading(true)
    setError('')

    let lat: number | null = null
    let lng: number | null = null

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
      )
      lat = pos.coords.latitude
      lng = pos.coords.longitude
      setLocationLabel(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    } catch {
      setError('Could not get location. Clocking in without GPS.')
    }

    const endpoint = isClockedIn ? '/api/clock-out' : '/api/clock-in'
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng }),
    })

    if (!res.ok) {
      const { error: msg } = await res.json()
      setError(msg ?? 'Something went wrong')
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Big clock button */}
      <button
        onClick={handleClock}
        disabled={loading || !!isDone}
        className={`
          w-52 h-52 rounded-full text-white text-xl font-bold shadow-xl
          flex flex-col items-center justify-center gap-2 transition-all
          active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed
          ${isClockedIn
            ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-200'
            : isDone
              ? 'bg-gradient-to-br from-slate-400 to-slate-500'
              : 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-200'}
        `}
      >
        {loading ? (
          <Loader2 className="w-10 h-10 animate-spin" />
        ) : (
          <>
            <span className="text-4xl">{isDone ? '✓' : isClockedIn ? '⏹' : '▶'}</span>
            <span>{isDone ? 'Done' : isClockedIn ? 'Clock Out' : 'Clock In'}</span>
          </>
        )}
      </button>

      {/* Times */}
      {todayRecord?.clock_in_at && (
        <div className="text-center space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Clocked in: <strong>{formatTime(todayRecord.clock_in_at)}</strong>
          </div>
          {todayRecord.clock_out_at && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              Clocked out: <strong>{formatTime(todayRecord.clock_out_at)}</strong>
            </div>
          )}
          {todayRecord.hours_worked != null && (
            <p className="text-xs text-slate-400">
              {todayRecord.hours_worked.toFixed(1)} hrs worked
              {todayRecord.ot_hours && todayRecord.ot_hours > 0
                ? ` (${todayRecord.ot_hours.toFixed(1)} OT)`
                : ''}
            </p>
          )}
        </div>
      )}

      {/* GPS feedback */}
      {locationLabel && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <MapPin className="w-3 h-3" />
          {locationLabel}
        </div>
      )}

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
    </div>
  )
}
