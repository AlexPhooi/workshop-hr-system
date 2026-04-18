import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Settings,
  Truck,
  LogOut,
} from 'lucide-react'

const nav = [
  { href: '/boss/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/boss/drivers', icon: Users, label: 'Drivers' },
  { href: '/boss/claims', icon: FileText, label: 'Claims' },
  { href: '/boss/payroll', icon: CreditCard, label: 'Payroll' },
  { href: '/boss/settings', icon: Settings, label: 'Settings' },
]

export default function BossLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-slate-900 text-white fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-sm">ATR Logistics</p>
            <p className="text-xs text-slate-400">Boss Dashboard</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {nav.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-sm"
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 text-white z-30 flex items-center gap-3 px-4 py-3">
        <Truck className="w-5 h-5 text-blue-400" />
        <span className="font-semibold text-sm">ATR Logistics</span>
      </div>

      {/* Main */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
        <div className="flex">
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
