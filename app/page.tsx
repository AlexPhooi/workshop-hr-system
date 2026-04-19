export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  // Verify session with regular client (reads cookies for auth)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Service role client with NO cookies — ensures PostgREST uses the
  // service role key for auth (not the user JWT), bypassing RLS fully
  const service = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  redirect(profile?.role === 'boss' ? '/boss/dashboard' : '/driver/dashboard')
}
