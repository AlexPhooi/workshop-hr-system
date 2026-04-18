'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Camera, Upload, Loader2, CheckCircle } from 'lucide-react'
import { ClaimType } from '@/lib/types'

const CLAIM_TYPES: { value: ClaimType; label: string; needsReceipt: boolean }[] = [
  { value: 'toll', label: 'Toll', needsReceipt: true },
  { value: 'fuel', label: 'Fuel', needsReceipt: true },
  { value: 'outstation', label: 'Outstation / Overnight', needsReceipt: true },
]

export default function ClaimForm() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [type, setType] = useState<ClaimType>('toll')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const selectedType = CLAIM_TYPES.find((t) => t.value === type)!

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedType.needsReceipt && !file) {
      setError('Please attach a receipt photo for this claim type.')
      return
    }
    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('type', type)
    formData.append('amount', amount)
    formData.append('notes', notes)
    if (file) formData.append('receipt', file)

    const res = await fetch('/api/claims', { method: 'POST', body: formData })
    if (!res.ok) {
      const { error: msg } = await res.json()
      setError(msg ?? 'Submission failed')
      setLoading(false)
      return
    }
    setSubmitted(true)
    setTimeout(() => router.push('/driver/claims'), 1500)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8">
        <CheckCircle className="w-16 h-16 text-green-500" />
        <p className="text-lg font-semibold text-slate-900">Claim Submitted!</p>
        <p className="text-sm text-slate-500">Redirecting…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-5">
      <div className="space-y-1.5">
        <Label>Claim Type</Label>
        <div className="grid grid-cols-3 gap-2">
          {CLAIM_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                type === t.value
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="amount">Amount (RM)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input
          id="notes"
          type="text"
          placeholder="e.g. North-South Highway, KL to JB"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Receipt upload */}
      <div className="space-y-1.5">
        <Label>
          Receipt Photo{' '}
          {selectedType.needsReceipt ? (
            <span className="text-red-500">*</span>
          ) : (
            <span className="text-slate-400">(optional)</span>
          )}
        </Label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="hidden"
        />
        {preview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Receipt" className="w-full rounded-xl object-cover max-h-48" />
            <button
              type="button"
              onClick={() => { setFile(null); setPreview(null) }}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            <Camera className="w-8 h-8" />
            <span className="text-sm">Tap to take photo or upload</span>
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting…
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Submit Claim
          </>
        )}
      </Button>
    </form>
  )
}
