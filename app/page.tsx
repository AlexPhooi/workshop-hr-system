export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  // Verify session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Direct REST fetch with service role key — bypasses SDK + RLS entirely
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=role`
  const res = await fetch(url, {
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''}`,
    },
    cache: 'no-store',
  })

  const rows = await res.json()
  const role = rows[0]?.role ?? 'driver'

  redirect(role === 'boss' ? '/boss/dashboard' : '/driver/dashboard')
}
