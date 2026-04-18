'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRM, formatDate } from '@/lib/utils'
import { Claim } from '@/lib/types'
import { CheckCircle, XCircle, ExternalLink, Loader2 } from 'lucide-react'

const typeLabels: Record<string, string> = {
  toll: 'Toll',
  fuel: 'Fuel',
  outstation: 'Outstation',
  meal: 'Meal',
  telco: 'Telco',
}

export default function ClaimsReviewPage() {
  const supabase = createClient()
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  async function loadClaims() {
    const { data } = await supabase
      .from('claims')
      .select('*, drivers(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    setClaims((data as Claim[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { loadClaims() }, [])

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    setProcessing(id)
    await supabase
      .from('claims')
      .update({ status, approved_at: new Date().toISOString() })
      .eq('id', id)
    await loadClaims()
    setProcessing(null)
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Claims Review</h1>
        <p className="text-slate-500 text-sm">
          {loading ? '…' : claims.length === 0 ? 'All clear' : `${claims.length} pending`}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : claims.length === 0 ? (
        <Card>
          <CardContent className="p-12 flex flex-col items-center gap-3 text-slate-400">
            <CheckCircle className="w-12 h-12 text-green-300" />
            <p className="font-medium">No pending claims</p>
            <p className="text-sm">All claims have been reviewed.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => (
            <Card key={claim.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900">
                        {claim.drivers?.name ?? 'Unknown'}
                      </span>
                      <Badge variant="warning">{typeLabels[claim.type] ?? claim.type}</Badge>
                      <span className="text-slate-400 text-sm">{formatDate(claim.date)}</span>
                    </div>
                    {claim.notes && (
                      <p className="text-sm text-slate-600">{claim.notes}</p>
                    )}
                    {claim.receipt_url && (
                      <a
                        href={claim.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Receipt
                      </a>
                    )}
                    <p className="text-xl font-bold text-slate-900">{formatRM(claim.amount)}</p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => updateStatus(claim.id, 'approved')}
                      disabled={processing === claim.id}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {processing === claim.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <><CheckCircle className="w-3 h-3" /> Approve</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateStatus(claim.id, 'rejected')}
                      disabled={processing === claim.id}
                    >
                      <XCircle className="w-3 h-3" /> Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
