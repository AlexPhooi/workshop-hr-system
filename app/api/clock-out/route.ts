import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { computeAttendanceHours } from '@/lib/payroll/calculate'

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient()
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

  const { data: att } = await supabase
    .from('attendance')
    .select('id, clock_in_at, clock_out_at')
    .eq('driver_id', profile.driver_id)
    .eq('date', today)
    .maybeSingle()

  if (!att?.clock_in_at)
    return NextResponse.json({ error: 'Not clocked in today' }, { status: 400 })

  if (att.clock_out_at)
    return NextResponse.json({ error: 'Already clocked out today' }, { status: 400 })

  const clockOutAt = new Date().toISOString()
  const { hours_worked, ot_hours } = computeAttendanceHours(att.clock_in_at, clockOutAt)

  const { error } = await supabase
    .from('attendance')
    .update({
      clock_out_at: clockOutAt,
      clock_out_lat: lat ?? null,
      clock_out_lng: lng ?? null,
      hours_worked,
      ot_hours,
    })
    .eq('id', att.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, hours_worked, ot_hours })
}
