'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Truck } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<'email' | 'phone'>('phone')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
    router.push(profile?.role === 'boss' ? '/boss/dashboard' : '/driver/dashboard')
    router.refresh()
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formatted = phone.startsWith('+') ? phone : `+60${phone.replace(/^0/, '')}`
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted })
    if (error) { setError(error.message); setLoading(false); return }
    setStep('otp')
    setLoading(false)
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formatted = phone.startsWith('+') ? phone : `+60${phone.replace(/^0/, '')}`
    const { error } = await supabase.auth.verifyOtp({ phone: formatted, token: otp, type: 'sms' })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/driver/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white mb-2">
            <Truck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">ATR Logistics</h1>
          <p className="text-slate-500 text-sm">Driver & Payroll Management</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex rounded-lg bg-slate-100 p-1 gap-1">
              <button
                onClick={() => setMode('phone')}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${mode === 'phone' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Driver (OTP)
              </button>
              <button
                onClick={() => setMode('email')}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${mode === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Boss (Email)
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {mode === 'email' ? (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="boss@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</Button>
              </form>
            ) : step === 'credentials' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="01x-xxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  <p className="text-xs text-slate-400">Malaysian number — we&apos;ll add +60</p>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Sending…' : 'Send OTP'}</Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <p className="text-sm text-slate-600">Enter the 6-digit code sent to <strong>{phone}</strong></p>
                <div className="space-y-1.5">
                  <Label htmlFor="otp">OTP Code</Label>
                  <Input id="otp" type="text" inputMode="numeric" maxLength={6} placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} required />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Verifying…' : 'Verify OTP'}</Button>
                <button type="button" onClick={() => setStep('credentials')} className="text-sm text-blue-600 hover:underline w-full text-center">Change number</button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
