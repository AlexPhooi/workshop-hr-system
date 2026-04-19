import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isNationalHoliday, isRestDay } from '@/lib/payroll/holidays'

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lat, lng } = await req.json()

  const { data: profile } = await supabase
    .from('profiles')
    .select('driver_id')
    .eq('id', user.id)
    .single()

  if (!profile?.driver_id)
    return NextResponse.json({ error: 'Driver profile not found' }, { status: 400 })

  const today = new Date().toISOString().split('T')[0]

  // Check not already clocked in
  const { data: existing } = await supabase
    .from('attendance')
    .select('id, clock_in_at')
    .eq('driver_id', profile.driver_id)
    .eq('date', today)
    .maybeSingle()

  if (existing?.clock_in_at)
    return NextResponse.json({ error: 'Already clocked in today' }, { status: 400 })

  const dayType = isNationalHoliday(today)
    ? 'public_holiday'
    : isRestDay(today)
      ? 'rest'
      : 'normal'

  const { error } = await supabase.from('attendance').upsert({
    driver_id: profile.driver_id,
    date: today,
    clock_in_at: new Date().toISOString(),
    clock_in_lat: lat ?? null,
    clock_in_lng: lng ?? null,
    day_type: dayType,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
