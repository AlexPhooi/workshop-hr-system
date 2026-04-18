import Link from 'next/link'
import { Home, Clock, FileText, Calendar, CreditCard } from 'lucide-react'

const nav = [
  { href: '/driver/dashboard', icon: Home, label: 'Home' },
  { href: '/driver/clock', icon: Clock, label: 'Clock' },
  { href: '/driver/claims', icon: FileText, label: 'Claims' },
  { href: '/driver/attendance', icon: Calendar, label: 'Attendance' },
  { href: '/driver/payslip', icon: CreditCard, label: 'Payslip' },
]

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <main className="max-w-lg mx-auto">{children}</main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
        <div className="max-w-lg mx-auto flex">
          {nav.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-1 py-3 text-slate-400 hover:text-blue-600 transition-colors"
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
