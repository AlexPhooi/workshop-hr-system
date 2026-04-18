import ClaimForm from '@/components/driver/ClaimForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function NewClaimPage() {
  return (
    <div>
      <div className="flex items-center gap-2 p-4 pt-6">
        <Link href="/driver/claims" className="text-slate-400 hover:text-slate-600">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Submit Claim</h1>
      </div>
      <ClaimForm />
    </div>
  )
}
