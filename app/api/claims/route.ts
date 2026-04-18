import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireDriver, isAllowedReceiptType, isValidClaimType } from '@/lib/api-auth'
import { ClaimType } from '@/lib/types'

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient()
  const auth = await requireDriver(supabase)
  if (auth instanceof NextResponse) return auth

  const { driverId } = auth

  const formData = await req.formData()
  const type = formData.get('type') as string
  const amount = parseFloat(formData.get('amount') as string)
  const notes = formData.get('notes') as string | null
  const receiptFile = formData.get('receipt') as File | null

  if (!isValidClaimType(type))
    return NextResponse.json({ error: 'Invalid claim type' }, { status: 400 })

  if (isNaN(amount) || amount <= 0 || amount > 10000)
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

  if (notes && notes.length > 500)
    return NextResponse.json({ error: 'Notes too long (max 500 characters)' }, { status: 400 })

  // Validate receipt file type against an allowlist
  if (receiptFile && !isAllowedReceiptType(receiptFile.type))
    return NextResponse.json(
      { error: 'Receipt must be a JPEG, PNG, WebP, or HEIC image' },
      { status: 400 }
    )

  // Get driver to check caps
  const { data: driver } = await supabase
    .from('drivers')
    .select('fuel_cap, toll_cap')
    .eq('id', driverId)
    .single()

  let status: 'auto_approved' | 'pending' = 'auto_approved'
  if (type === 'fuel' && driver?.fuel_cap && amount > driver.fuel_cap) status = 'pending'
  if (type === 'toll' && driver?.toll_cap && amount > driver.toll_cap) status = 'pending'
  if (type === 'outstation') status = 'pending'

  // Upload receipt
  let receipt_url: string | null = null
  if (receiptFile) {
    // Use a safe extension derived from the validated MIME type, not the filename
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'image/heif': 'heif',
    }
    const ext = mimeToExt[receiptFile.type.toLowerCase()] ?? 'jpg'
    const path = `${driverId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(path, receiptFile, { contentType: receiptFile.type })

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(path)
      receipt_url = publicUrl
    }
  }

  const { error } = await supabase.from('claims').insert({
    driver_id: driverId,
    type: type as ClaimType,
    amount,
    notes: notes || null,
    receipt_url,
    status,
    date: new Date().toISOString().split('T')[0],
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, status })
}
