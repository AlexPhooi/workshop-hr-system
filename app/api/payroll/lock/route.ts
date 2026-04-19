import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireBoss } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const auth = await requireBoss(supabase)
  if (auth instanceof NextResponse) return auth

  const { run_id } = await req.json()
  if (!run_id) return NextResponse.json({ error: 'run_id required' }, { status: 400 })

  const { error } = await supabase
    .from('payroll_runs')
    .update({ status: 'locked' })
    .eq('id', run_id)
    .eq('status', 'draft')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
