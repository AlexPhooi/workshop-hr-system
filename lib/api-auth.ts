import { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * Returns the boss's user ID if the caller is authenticated as boss,
 * or a 401/403 NextResponse to return immediately.
 */
export async function requireBoss(
  supabase: SupabaseClient
): Promise<{ userId: string } | NextResponse> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'boss')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return { userId: user.id }
}

/**
 * Returns the driver_id if the caller is authenticated as a driver,
 * or a 401/403 NextResponse.
 */
export async function requireDriver(
  supabase: SupabaseClient
): Promise<{ userId: string; driverId: string } | NextResponse> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, driver_id')
    .eq('id', user.id)
    .single()

  if (!profile?.driver_id)
    return NextResponse.json({ error: 'Driver profile not found' }, { status: 403 })

  return { userId: user.id, driverId: profile.driver_id }
}

/** Escape HTML special characters to prevent XSS in generated HTML. */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Prefix CSV fields that start with formula-triggering characters
 * to prevent CSV injection in Excel / Google Sheets.
 */
export function safeCsvField(value: string | number | null | undefined): string {
  const str = String(value ?? '')
  // Prefix dangerous leading characters with a tab so Excel treats them as text
  if (/^[=+\-@\t\r]/.test(str)) return `\t${str}`
  return str
}

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])

/** Returns true if the MIME type is an allowed receipt image format. */
export function isAllowedReceiptType(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.has(mimeType.toLowerCase())
}

const VALID_CLAIM_TYPES = new Set(['toll', 'fuel', 'outstation', 'meal', 'telco'])

export function isValidClaimType(type: string): boolean {
  return VALID_CLAIM_TYPES.has(type)
}
