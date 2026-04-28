'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Kanban, Building2, Users, LogOut, Package, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/clients', label: 'Clientes', icon: Building2 },
  { href: '/products', label: 'Produtos', icon: Package },
  { href: '/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/team', label: 'Equipe', icon: Users },
]

type Props = {
  userName: string
  userEmail: string
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export function Sidebar({ userName, userEmail }: Props) {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-[#0C1A2E] text-white shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="space-y-2">
          <Image
            src="/brand-logo.png"
            alt="Blue CRM"
            width={179}
            height={60}
            className="h-auto w-[150px] drop-shadow-[0_4px_18px_rgba(0,0,0,0.35)]"
            priority
          />
          <p className="pl-1 text-xs text-white/45">Sales Platform</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3 mb-3">Menu</p>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-blue/20 text-blue border border-blue/20'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-blue' : 'text-white/50')} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue/60 to-blue-vivid/60 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">{initials(userName)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{userName}</p>
            <p className="text-[10px] text-white/40 truncate">{userEmail}</p>
          </div>
        </div>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white hover:bg-white/8 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}
