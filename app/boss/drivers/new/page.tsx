'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PayType } from '@/lib/types'

const STATES = ['Johor','Kedah','Kelantan','Melaka','Negeri Sembilan','Pahang','Perak','Perlis','Pulau Pinang','Sabah','Sarawak','Selangor','Terengganu','W.P. Kuala Lumpur','W.P. Labuan','W.P. Putrajaya']

export default function NewDriverPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [payType, setPayType] = useState<PayType>('monthly')

  const [form, setForm] = useState({
    name: '', ic_number: '', phone: '', email: '',
    bank_name: '', bank_account: '',
    base_salary: '', daily_rate: '', trip_rate: '',
    state: 'Selangor',
    telco_allowance: '50', meal_per_day: '10',
    fuel_cap: '', toll_cap: '', outstation_rate: '80',
    epf_eligible: true, socso_eligible: true,
  })

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.from('drivers').insert({
      name: form.name,
      ic_number: form.ic_number,
      phone: form.phone,
      email: form.email || null,
      bank_name: form.bank_name,
      bank_account: form.bank_account,
      pay_type: payType,
      base_salary: payType === 'monthly' ? parseFloat(form.base_salary) || null : null,
      daily_rate: payType === 'daily' ? parseFloat(form.daily_rate) || null : null,
      trip_rate: payType === 'trip' ? parseFloat(form.trip_rate) || null : null,
      state: form.state,
      telco_allowance: parseFloat(form.telco_allowance) || 50,
      meal_per_day: parseFloat(form.meal_per_day) || 10,
      fuel_cap: form.fuel_cap ? parseFloat(form.fuel_cap) : null,
      toll_cap: form.toll_cap ? parseFloat(form.toll_cap) : null,
      outstation_rate: parseFloat(form.outstation_rate) || 80,
      epf_eligible: form.epf_eligible,
      socso_eligible: form.socso_eligible,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/boss/drivers')
    router.refresh()
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/boss/drivers" className="text-slate-400 hover:text-slate-600">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Add Driver</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Personal Info</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ic">IC Number *</Label>
              <Input id="ic" placeholder="000000-00-0000" value={form.ic_number} onChange={(e) => set('ic_number', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" type="tel" placeholder="01x-xxxxxxx" value={form.phone} onChange={(e) => set('phone', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Select id="state" value={form.state} onChange={(e) => set('state', e.target.value)}>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Bank Details</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bank_name">Bank Name *</Label>
              <Input id="bank_name" placeholder="Maybank" value={form.bank_name} onChange={(e) => set('bank_name', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bank_account">Account Number *</Label>
              <Input id="bank_account" value={form.bank_account} onChange={(e) => set('bank_account', e.target.value)} required />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pay Structure</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {(['monthly', 'daily', 'trip'] as PayType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPayType(t)}
                  className={`p-3 rounded-xl border text-sm font-medium capitalize transition-all ${
                    payType === t
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {payType === 'monthly' && (
              <div className="space-y-1.5">
                <Label htmlFor="base_salary">Monthly Salary (RM) *</Label>
                <Input id="base_salary" type="number" step="0.01" value={form.base_salary} onChange={(e) => set('base_salary', e.target.value)} required />
              </div>
            )}
            {payType === 'daily' && (
              <div className="space-y-1.5">
                <Label htmlFor="daily_rate">Daily Rate (RM) *</Label>
                <Input id="daily_rate" type="number" step="0.01" value={form.daily_rate} onChange={(e) => set('daily_rate', e.target.value)} required />
              </div>
            )}
            {payType === 'trip' && (
              <div className="space-y-1.5">
                <Label htmlFor="trip_rate">Rate Per Trip (RM) *</Label>
                <Input id="trip_rate" type="number" step="0.01" value={form.trip_rate} onChange={(e) => set('trip_rate', e.target.value)} required />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Allowances &amp; Caps</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="telco">Telco Allowance/mo (RM)</Label>
              <Input id="telco" type="number" value={form.telco_allowance} onChange={(e) => set('telco_allowance', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meal">Meal Allowance/day (RM)</Label>
              <Input id="meal" type="number" value={form.meal_per_day} onChange={(e) => set('meal_per_day', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fuel_cap">Fuel Cap/mo (RM)</Label>
              <Input id="fuel_cap" type="number" placeholder="No cap" value={form.fuel_cap} onChange={(e) => set('fuel_cap', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="toll_cap">Toll Cap/mo (RM)</Label>
              <Input id="toll_cap" type="number" placeholder="No cap" value={form.toll_cap} onChange={(e) => set('toll_cap', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="outstation_rate">Outstation Rate/night (RM)</Label>
              <Input id="outstation_rate" type="number" value={form.outstation_rate} onChange={(e) => set('outstation_rate', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Statutory</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.epf_eligible}
                onChange={(e) => set('epf_eligible', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 accent-blue-600"
              />
              <span className="text-sm text-slate-700">EPF eligible</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.socso_eligible}
                onChange={(e) => set('socso_eligible', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 accent-blue-600"
              />
              <span className="text-sm text-slate-700">SOCSO eligible</span>
            </label>
            <p className="text-xs text-slate-400">EIS is always calculated for all employees.</p>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Add Driver'}
        </Button>
      </form>
    </div>
  )
}
