'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  Network,
  GitCompare,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Overview', icon: LayoutDashboard, href: '/overview' },
  { label: 'Customers', icon: Users, href: '/customers' },
  { label: 'Transactions', icon: ArrowLeftRight, href: '/transactions' },
  { label: 'Network', icon: Network, href: '/network' },
  { label: 'Comparison', icon: GitCompare, href: '/comparison' },
];

const ROUTE_TITLES: Record<string, string> = {
  '/overview': 'Overview',
  '/customers': 'Customers',
  '/transactions': 'Transaction Scoring',
  '/network': 'Network Analysis',
  '/comparison': 'Rules vs Model',
};

function getPageTitle(pathname: string): string {
  // Exact match first
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  // Prefix match for nested routes
  for (const [route, title] of Object.entries(ROUTE_TITLES)) {
    if (pathname.startsWith(route + '/')) return title;
  }
  return 'Adaptive AML Platform';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', minWidth: 1280 }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          minWidth: 240,
          backgroundColor: '#011E41',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: '28px 24px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* TODO: replace with crowe-logo-white-wordmark.png */}
          <span
            style={{
              color: 'white',
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: '0.2em',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            CROWE
          </span>
          <div
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 10,
              marginTop: 4,
              letterSpacing: '0.05em',
            }}
          >
            AI INNOVATION
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 0', flex: 1 }}>
          {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
            const isActive = pathname === href || (href !== '/overview' && pathname.startsWith(href + '/'));
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 20px',
                  color: 'white',
                  fontSize: 14,
                  textDecoration: 'none',
                  backgroundColor: isActive ? '#002E62' : 'transparent',
                  borderLeft: isActive ? '3px solid #F5A800' : '3px solid transparent',
                  transition: 'background-color 0.15s',
                }}
              >
                <Icon size={20} color="white" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer label */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.4)',
            fontSize: 11,
          }}
        >
          Goldman Sachs Demo
        </div>
      </aside>

      {/* Main area */}
      <div style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <header
          style={{
            height: 56,
            backgroundColor: 'white',
            borderBottom: '1px solid #E0E0E0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 16, color: '#011E41' }}>{pageTitle}</span>
          <span style={{ color: '#828282', fontSize: 12 }}>Goldman Sachs Demo</span>
        </header>

        {/* Content */}
        <main
          style={{
            flex: 1,
            backgroundColor: 'white',
            padding: 32,
            overflowY: 'auto',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
