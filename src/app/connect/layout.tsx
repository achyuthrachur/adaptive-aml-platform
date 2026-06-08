import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Connect Data Source — Crowe AML' }

export default function ConnectLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ backgroundColor: '#050E1A', minHeight: '100vh' }}>{children}</div>
}
