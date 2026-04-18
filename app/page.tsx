export const dynamic = 'force-dynamic'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  // Use regular client to verify the session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  console.log('[root] user.id:', user?.id, 'user.email:', user?.email)

  if (!user) redirect('/login')

  // Use service client to read role — bypasses RLS so it never returns null
  const service = await createServiceClient()
  const { data: profile, error: profileError } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  console.log('[root] profile:', JSON.stringify(profile), 'error:', profileError?.message)
  console.log('[root] service key set:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

  redirect(profile?.role === 'boss' ? '/boss/dashboard' : '/driver/dashboard')
}
