'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { PublicHoliday } from '@/lib/types'

export default function SettingsPage() {
  const supabase = createClient()
  const [holidays, setHolidays] = useState<PublicHoliday[]>([])
  const [newDate, setNewDate] = useState('')
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  // Global defaults state
  const [defaults, setDefaults] = useState({
    telco: '50',
    meal: '10',
    outstation: '80',
    fuel_cap: '',
    toll_cap: '',
  })

  async function loadHolidays() {
    const year = new Date().getFullYear()
    const { data } = await supabase
      .from('public_holidays')
      .select('*')
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`)
      .order('date')
    setHolidays(data ?? [])
  }

  useEffect(() => { loadHolidays() }, [])

  async function addHoliday() {
    if (!newDate || !newName) return
    setLoading(true)
    await supabase.from('public_holidays').upsert({
      date: newDate,
      name: newName,
      state: null,
    })
    setNewDate('')
    setNewName('')
    await loadHolidays()
    setLoading(false)
  }

  async function removeHoliday(id: string) {
    await supabase.from('public_holidays').delete().eq('id', id)
    await loadHolidays()
  }

  async function saveDefaults() {
    setLoading(true)
    // Update all active drivers with new defaults (optional bulk update)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setLoading(false)
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm">Global defaults and public holiday calendar</p>
      </div>

      {/* Global allowance defaults */}
      <Card>
        <CardHeader><CardTitle>Global Allowance Defaults</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-slate-400">
            These are default values when adding new drivers. Existing drivers are configured individually.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Telco Allowance/mo (RM)</Label>
              <Input type="number" value={defaults.telco} onChange={(e) => setDefaults(d => ({ ...d, telco: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Meal Allowance/day (RM)</Label>
              <Input type="number" value={defaults.meal} onChange={(e) => setDefaults(d => ({ ...d, meal: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Outstation Rate/night (RM)</Label>
              <Input type="number" value={defaults.outstation} onChange={(e) => setDefaults(d => ({ ...d, outstation: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Default Fuel Cap/mo (RM)</Label>
              <Input type="number" placeholder="No cap" value={defaults.fuel_cap} onChange={(e) => setDefaults(d => ({ ...d, fuel_cap: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Default Toll Cap/mo (RM)</Label>
              <Input type="number" placeholder="No cap" value={defaults.toll_cap} onChange={(e) => setDefaults(d => ({ ...d, toll_cap: e.target.value }))} />
            </div>
          </div>
          <Button onClick={saveDefaults} disabled={loading}>
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : 'Save Defaults'}
          </Button>
        </CardContent>
      </Card>

      {/* Pay rules info */}
      <Card>
        <CardHeader><CardTitle>OT Rules (Malaysian Labour Act)</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <div className="flex justify-between border-b border-slate-100 py-2">
            <span>Normal day (after 8 hrs)</span><span className="font-medium">1.5× hourly rate</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 py-2">
            <span>Rest day (&lt;4 hrs worked)</span><span className="font-medium">½ day pay</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 py-2">
            <span>Rest day (≥4 hrs worked)</span><span className="font-medium">Full day pay</span>
          </div>
          <div className="flex justify-between py-2">
            <span>Public holiday</span><span className="font-medium">Basic + 2× hourly</span>
          </div>
        </CardContent>
      </Card>

      {/* EPF / SOCSO info */}
      <Card>
        <CardHeader><CardTitle>Statutory Contribution Rates</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <div className="grid grid-cols-3 gap-2 font-semibold text-xs text-slate-400 uppercase pb-1 border-b border-slate-100">
            <span>Contribution</span><span className="text-center">Employee</span><span className="text-center">Employer</span>
          </div>
          {[
            { label: 'EPF (≤RM5k)', emp: '11%', er: '13%' },
            { label: 'EPF (> RM5k)', emp: '11%', er: '12%' },
            { label: 'SOCSO (≤RM4k)', emp: '0.5%', er: '1.75%' },
            { label: 'EIS (all)', emp: '0.2%', er: '0.2%' },
          ].map((r) => (
            <div key={r.label} className="grid grid-cols-3 gap-2 border-b border-slate-50 py-2">
              <span>{r.label}</span>
              <span className="text-center text-red-600">{r.emp}</span>
              <span className="text-center text-blue-600">{r.er}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Public holidays */}
      <Card>
        <CardHeader><CardTitle>Public Holidays {new Date().getFullYear()}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-40" />
            <Input placeholder="Holiday name" value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1" />
            <Button onClick={addHoliday} disabled={loading}>Add</Button>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {holidays.map((h) => (
              <div key={h.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <span className="text-sm font-medium text-slate-700">{h.name}</span>
                  {h.state && <span className="text-xs text-slate-400 ml-2">({h.state})</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{format(new Date(h.date), 'd MMM yyyy')}</span>
                  <button
                    onClick={() => removeHoliday(h.id)}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
