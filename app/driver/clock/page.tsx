export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClockButton from '@/components/driver/ClockButton'

export default async function ClockPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('driver_id')
    .eq('id', user.id)
    .single()

  const today = new Date().toISOString().split('T')[0]
  const { data: todayRecord } = await supabase
    .from('attendance')
    .select('*')
    .eq('driver_id', profile!.driver_id)
    .eq('date', today)
    .maybeSingle()

  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8">
      <div className="text-center">
        <p className="text-5xl font-bold text-slate-900 tabular-nums">{timeStr}</p>
        <p className="text-slate-500 mt-1 text-sm">{dateStr}</p>
      </div>

      <ClockButton todayRecord={todayRecord} />
    </div>
  )
}
