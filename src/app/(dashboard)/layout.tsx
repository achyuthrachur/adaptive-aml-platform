'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Users, ArrowLeftRight,
  Network, GitCompare, Database, Home,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Overview', icon: LayoutDashboard, href: '/overview' },
  { label: 'Customers', icon: Users, href: '/customers' },
  { label: 'Transactions', icon: ArrowLeftRight, href: '/transactions' },
  { label: 'Network', icon: Network, href: '/network' },
  { label: 'Rules vs Model', icon: GitCompare, href: '/comparison' },
  { label: 'Data Sources', icon: Database, href: '/connect' },
]

const ROUTE_TITLES: Record<string, string> = {
  '/overview': 'Overview',
  '/customers': 'Customers',
  '/transactions': 'Transaction Scoring',
  '/network': 'Network Analysis',
  '/comparison': 'Rules vs Model',
  '/sar': 'SAR Draft Generator',
  '/connect': 'Data Sources',
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
          <Link href="/">
            <Image src="/crowe-logo-white.svg" alt="Crowe" width={88} height={24} className="h-6 w-auto" priority />
          </Link>
          <div className="mt-2 text-[10px] text-white/40 font-medium tracking-widest uppercase">AML Intelligence</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
            const isActive = pathname === href || (href !== '/overview' && href !== '/connect' && pathname.startsWith(href + '/'))
            const isExternal = href === '/connect'
            return (
              <Link key={href} href={href} className="block">
                <motion.div
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.12 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors relative"
                  style={{
                    color: isActive ? 'white' : isExternal ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.65)',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                    borderLeft: isActive ? '3px solid #F5A800' : '3px solid transparent',
                  }}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={isActive ? 'font-semibold' : 'font-normal'}>{label}</span>
                  {isExternal && (
                    <span className="ml-auto text-[10px] font-medium rounded px-1.5 py-0.5"
                      style={{ backgroundColor: 'rgba(245,168,0,0.15)', color: '#F5A800' }}>
                      NEW
                    </span>
                  )}
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* Home link */}
        <div className="px-3 pb-2">
          <Link href="/" className="block">
            <motion.div whileHover={{ x: 2 }} transition={{ duration: 0.12 }}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-xs transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)' }}>
              <Home size={13} />
              <span>Back to home</span>
            </motion.div>
          </Link>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10">
          <div className="text-[10px] text-white/25 leading-relaxed">© 2026 Crowe LLP<br />AI Innovation Team</div>
        </div>
      </aside>

      {/* Main */}
      <div className="ml-[220px] flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-[52px] items-center justify-between border-b border-[#E8ECF0] bg-white/95 backdrop-blur-sm px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <motion.h1
              key={pathname}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="text-md font-semibold text-[#011E41] tracking-tight"
            >
              {pageTitle}
            </motion.h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#E0E0E0] px-3 py-1 text-xs text-[#828282] font-medium bg-[#F8F9FB]">
              AML Demo · Synthetic Data
            </span>
          </div>
        </header>

        {/* Content with page transition */}
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
