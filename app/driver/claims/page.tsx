import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRM, formatDate } from '@/lib/utils'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { ClaimStatus } from '@/lib/types'

const statusConfig: Record<ClaimStatus, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  auto_approved: { label: 'Auto Approved', variant: 'success' },
  approved: { label: 'Approved', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  rejected: { label: 'Rejected', variant: 'destructive' },
}

const typeLabels: Record<string, string> = {
  toll: 'Toll',
  fuel: 'Fuel',
  outstation: 'Outstation',
  meal: 'Meal',
  telco: 'Telco',
}

export default async function ClaimsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('driver_id').eq('id', user.id).single()
  const { start } = { start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0] }

  const { data: claims } = await supabase
    .from('claims')
    .select('*')
    .eq('driver_id', profile!.driver_id)
    .gte('date', start)
    .order('created_at', { ascending: false })

  const totalApproved = (claims ?? [])
    .filter((c) => c.status === 'auto_approved' || c.status === 'approved')
    .reduce((s, c) => s + c.amount, 0)

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Claims</h1>
          <p className="text-sm text-slate-500">This month: {formatRM(totalApproved)} approved</p>
        </div>
        <Link href="/driver/claims/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />
            New
          </Button>
        </Link>
      </div>

      {!claims?.length ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-400">
            No claims this month yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {claims.map((claim) => {
            const s = statusConfig[claim.status as ClaimStatus]
            return (
              <Card key={claim.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">
                        {typeLabels[claim.type] ?? claim.type}
                      </span>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(claim.date)}</p>
                    {claim.notes && <p className="text-xs text-slate-500 mt-0.5">{claim.notes}</p>}
                  </div>
                  <span className="font-semibold text-slate-900">{formatRM(claim.amount)}</span>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
