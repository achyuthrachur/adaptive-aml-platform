'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  Network,
  GitCompare,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Overview', icon: LayoutDashboard, href: '/overview' },
  { label: 'Customers', icon: Users, href: '/customers' },
  { label: 'Transactions', icon: ArrowLeftRight, href: '/transactions' },
  { label: 'Network', icon: Network, href: '/network' },
  { label: 'Rules vs Model', icon: GitCompare, href: '/comparison' },
]

const ROUTE_TITLES: Record<string, string> = {
  '/overview': 'Overview',
  '/customers': 'Customers',
  '/transactions': 'Transaction Scoring',
  '/network': 'Network Analysis',
  '/comparison': 'Rules vs Model',
  '/sar': 'SAR Draft Generator',
}

function getPageTitle(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname]
  for (const [route, title] of Object.entries(ROUTE_TITLES)) {
    if (pathname.startsWith(route + '/')) return title
  }
  return 'Adaptive AML Platform'
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)

  return (
    <div className="flex min-h-screen min-w-[1280px] bg-[#F8F9FB]">
      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 bottom-0 z-50 flex w-[220px] flex-col"
        style={{
          background: 'linear-gradient(180deg, #011E41 0%, #01172E 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/10">
          <Image
            src="/crowe-logo-white.svg"
            alt="Crowe"
            width={88}
            height={24}
            className="h-6 w-auto"
            priority
          />
          <div className="mt-2 text-[10px] text-white/40 font-medium tracking-widest uppercase">
            AML Intelligence
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
            const isActive = pathname === href || (href !== '/overview' && pathname.startsWith(href + '/'))
            return (
              <Link key={href} href={href} className="block">
                <motion.div
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.12 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors relative"
                  style={{
                    color: isActive ? 'white' : 'rgba(255,255,255,0.65)',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                    borderLeft: isActive ? '3px solid #F5A800' : '3px solid transparent',
                  }}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={isActive ? 'font-semibold' : 'font-normal'}>{label}</span>
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10">
          <div className="text-[10px] text-white/25 leading-relaxed">
            © 2026 Crowe LLP<br />
            AI Innovation Team
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="ml-[220px] flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-[52px] items-center justify-between border-b border-[#E8ECF0] bg-white/95 backdrop-blur-sm px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-md font-semibold text-[#011E41] tracking-tight">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#E0E0E0] px-3 py-1 text-xs text-[#828282] font-medium bg-[#F8F9FB]">
              AML Demo · Synthetic Data
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
