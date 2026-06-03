'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { TrendingUp, Minus, Activity, MapPin } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area,
} from 'recharts'
import type { Customer } from '@/types/customer'
import type { Transaction } from '@/types/transaction'
import { formatCurrency, formatDate, getRiskColor, FEATURE_LABELS } from '@/lib/utils'
import ExplainerBanner from '@/components/ui/ExplainerBanner'
import RiskBadge from '@/components/ui/RiskBadge'
import TermTooltip from '@/components/ui/TermTooltip'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const SEGMENT_LABELS: Record<string, string> = {
  private_wealth: 'Private Wealth', corporate_treasury: 'Corporate Treasury',
  correspondent_banking: 'Correspondent Banking', retail: 'Retail',
}

const TX_TYPE_COLORS: Record<string, string> = {
  wire: '#F5A800', ach: '#05AB8C', check: '#0075C9', fx: '#B14FC5',
}

interface Props {
  customer: Customer; transactions: Transaction[]
  peerGroupSize: number; peerAvgVolume: number; peerAvgTx: number
  volumeDelta: number; txDelta: number
}

export default function CustomerProfileClient({
  customer, transactions, peerGroupSize, peerAvgVolume, peerAvgTx, volumeDelta, txDelta,
}: Props) {
  const router = useRouter()
  const riskColor = getRiskColor(customer.risk_score)
  const volumeData = buildWeeklyVolume(transactions, customer.baseline_monthly_volume / 4)
  const corridorData = buildCorridorHeatmap(transactions, customer.baseline_corridors)
  const txTypeCounts = buildTxTypeCounts(transactions)
  const driftData = buildDriftScore(transactions)
  const recentTx = transactions.slice(0, 20)

  const deltaColor = (d: number) => Math.abs(d) > 20 ? (d > 0 ? '#E5376B' : '#05AB8C') : '#828282'

  return (
    <div>
      <ExplainerBanner
        title={`Behavioral profile — ${customer.name}`}
        insight="This profile shows how this customer's activity compares to their own 90-day baseline and to their peer group. Deviations in volume, transaction corridors, counterparty patterns, and velocity all contribute to the behavioral risk score."
        pillars={[
          { icon: Activity, title: 'Behavioral Baseline', body: 'The customer\'s expected normal behavior established from 90 days of history. New activity is scored relative to this baseline.', color: '#0075C9' },
          { icon: MapPin, title: 'Corridor Familiarity', body: 'Transactions to jurisdictions not in the baseline are flagged as new corridors. These are a key AML signal — especially for correspondent banking.', color: '#F5A800' },
        ]}
      />

      <div className="flex gap-5 min-h-0">
        {/* Left column */}
        <div className="w-[300px] min-w-[300px] space-y-4">
          {/* Customer card */}
          <div className="rounded-lg p-5 text-white" style={{ background: 'linear-gradient(135deg, #011E41 0%, #01152E 100%)' }}>
            <div className="flex items-start justify-between mb-1">
              <h2 className="text-lg font-bold leading-tight">{customer.name}</h2>
            </div>
            <Badge variant="secondary" className="bg-white/15 text-white/80 border-0 text-xs mb-4">
              {SEGMENT_LABELS[customer.segment]}
            </Badge>
            <TermTooltip term="Peer Group" definition="Customers grouped by segment and behavioral similarity. Risk scores compare each transaction against this group's norms — not just the customer's own baseline.">
              <span className="text-xs text-white/50 mb-4 block">Peer Group {customer.peer_group}</span>
            </TermTooltip>

            <div className="mb-1">
              <span className="tabular-nums font-bold leading-none" style={{ fontSize: 52, color: riskColor }}>
                {customer.risk_score}
              </span>
            </div>
            <div className="text-xs text-white/50 mb-5">Risk Score · 0–100</div>

            <Separator className="bg-white/10 mb-4" />
            <div className="space-y-2.5 text-xs">
              {[
                { label: 'Avg Monthly Volume', value: formatCurrency(customer.baseline_monthly_volume) },
                { label: 'Avg Transaction Count', value: `${customer.baseline_transaction_count}/mo` },
                { label: 'Primary Corridors', value: customer.baseline_corridors.slice(0, 2).join(', ') },
              ].map(row => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-white/50">{row.label}</span>
                  <span className="text-white font-medium text-right max-w-[55%]">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Peer comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Peer Group {customer.peer_group}</CardTitle>
              <CardDescription>{peerGroupSize} customers in this group</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-2 text-xs">
              {[
                { label: 'Avg Group Volume', value: formatCurrency(peerAvgVolume) },
                { label: 'Avg Group Transactions', value: `${peerAvgTx}/mo` },
              ].map(row => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-[#828282]">{row.label}</span>
                  <span className="font-medium text-[#011E41] tabular-nums">{row.value}</span>
                </div>
              ))}
              <Separator />
              <TermTooltip term="Volume vs Group %" definition="How this customer's baseline volume compares to their peer group average. Values above +20% or below -20% are flagged as outliers and increase the peer_group_deviation feature score.">
                <div className="flex justify-between">
                  <span className="text-[#828282]">Volume vs Group</span>
                  <span className="font-semibold tabular-nums" style={{ color: deltaColor(volumeDelta) }}>
                    {volumeDelta > 0 ? '+' : ''}{volumeDelta}%
                  </span>
                </div>
              </TermTooltip>
              <div className="flex justify-between">
                <span className="text-[#828282]">Transactions vs Group</span>
                <span className="font-semibold tabular-nums" style={{ color: deltaColor(txDelta) }}>
                  {txDelta > 0 ? '+' : ''}{txDelta}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Volume over time */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Volume Over Time</CardTitle>
              <CardDescription>Customer vs peer group average · Anomaly = 2× above peer avg</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={volumeData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#828282' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#828282' }} axisLine={false} tickLine={false} width={50} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} label={{ value: 'Volume (USD)', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 9, fill: '#BDBDBD' } }} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), '']} labelStyle={{ fontWeight: 600 }} contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #E0E0E0' }} />
                  <Line type="monotone" dataKey="volume" stroke="#F5A800" strokeWidth={2} dot={false} name="This Customer" />
                  <Line type="monotone" dataKey="peerAvg" stroke="#0075C9" strokeWidth={1.5} dot={false} strokeDasharray="5 5" name="Peer Avg" />
                  {volumeData.map((d, i) => d.anomaly && (
                    <ReferenceLine key={i} x={d.week} stroke="#E5376B" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: 'Anomaly', fill: '#E5376B', fontSize: 9, position: 'insideTopRight' }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Two-col charts */}
          <div className="grid grid-cols-2 gap-4">
            {/* Tx type donut */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Mix</CardTitle>
                <CardDescription>By transaction type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <PieChart width={160} height={160}>
                    <Pie data={txTypeCounts} cx={75} cy={75} innerRadius={48} outerRadius={70} dataKey="value" paddingAngle={2}>
                      {txTypeCounts.map(e => <Cell key={e.name} fill={TX_TYPE_COLORS[e.name] || '#BDBDBD'} />)}
                    </Pie>
                  </PieChart>
                  <div className="space-y-2">
                    {txTypeCounts.map(e => (
                      <div key={e.name} className="flex items-center gap-2 text-xs">
                        <div className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: TX_TYPE_COLORS[e.name] || '#BDBDBD' }} />
                        <span className="text-[#011E41] capitalize font-medium">{e.name}</span>
                        <span className="text-[#828282] tabular-nums">({e.value})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Drift score */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <TermTooltip term="Behavioral Drift Score" definition="A composite weekly score measuring how far the customer's behavior has moved from their own baseline. Calculated as the normalized average of absolute ML feature values for that week's transactions.">
                    Behavioral Drift
                  </TermTooltip>
                </CardTitle>
                <CardDescription>Above 60 triggers manual review</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={driftData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#828282' }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#828282' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: number) => [v.toFixed(1), 'Drift Score']} contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                    <defs>
                      <linearGradient id="driftFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0075C9" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#0075C9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="score" stroke="#0075C9" strokeWidth={2} fill="url(#driftFill)" dot={false} />
                    <ReferenceLine y={60} stroke="#F5A800" strokeDasharray="4 4" label={{ value: '60 · Review', fill: '#F5A800', fontSize: 9, position: 'right' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Corridor heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>Corridor Activity Heatmap</CardTitle>
              <CardDescription>
                <TermTooltip term="New Corridor" definition="A counterparty jurisdiction not present in this customer's 90-day baseline. New corridors increase the corridor_familiarity feature score. Gold star (★) marks new corridors.">
                  Darker cells = higher volume · ★ = new corridor not in baseline
                </TermTooltip>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CorridorHeatmap data={corridorData} />
            </CardContent>
          </Card>

          {/* Recent transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Last {recentTx.length} transactions · sorted by date</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E0E0E0] bg-[#F8F9FB]">
                      {['Date', 'Amount', 'Dir', 'Counterparty', 'Jurisdiction', 'Rule', 'Score', ''].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-[11px] text-[#828282] whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentTx.map(tx => (
                      <tr key={tx.id} className="border-b border-[#F5F5F5] hover:bg-[#F8F9FB] transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap text-[#828282]">{formatDate(tx.date)}</td>
                        <td className="px-3 py-2 whitespace-nowrap tabular-nums font-medium text-[#011E41]">{formatCurrency(tx.amount)}</td>
                        <td className="px-3 py-2 capitalize text-xs font-medium" style={{ color: tx.direction === 'outbound' ? '#E5376B' : '#05AB8C' }}>{tx.direction}</td>
                        <td className="px-3 py-2 max-w-[110px] overflow-hidden text-ellipsis whitespace-nowrap text-[#011E41]">{tx.counterparty_name}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[#828282]">{tx.counterparty_jurisdiction}</td>
                        <td className="px-3 py-2">
                          {tx.rule_fired
                            ? <span className="bg-[#FEE2E2] text-[#DC2626] px-1.5 py-0.5 rounded text-[10px] font-medium">Fired</span>
                            : <span className="text-[#BDBDBD]">—</span>}
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-bold tabular-nums" style={{ color: getRiskColor(tx.ml_score) }}>{tx.ml_score}</span>
                        </td>
                        <td className="px-3 py-2">
                          <Button variant="link" size="sm" className="h-auto p-0 text-[11px]" onClick={() => router.push(`/transactions?selected=${tx.id}`)}>
                            Detail →
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// --- Data helpers ---
function buildWeeklyVolume(transactions: Transaction[], peerWeekAvg: number) {
  const endDate = new Date('2024-12-01')
  return Array.from({ length: 12 }, (_, i) => {
    const w = 12 - i
    const weekEnd = new Date(endDate); weekEnd.setDate(weekEnd.getDate() - (w - 1) * 7)
    const weekStart = new Date(weekEnd); weekStart.setDate(weekStart.getDate() - 7)
    const s = weekStart.toISOString().split('T')[0]; const e = weekEnd.toISOString().split('T')[0]
    const vol = transactions.filter(t => t.date >= s && t.date < e).reduce((sum, t) => sum + t.amount, 0)
    return { week: `W${13 - w}`, volume: vol, peerAvg: peerWeekAvg, anomaly: vol > peerWeekAvg * 2 }
  })
}

function buildCorridorHeatmap(transactions: Transaction[], baselineCorridors: string[]) {
  const endDate = new Date('2024-12-01')
  const weeks = Array.from({ length: 12 }, (_, i) => `W${i + 1}`)
  const allJurisdictions = Array.from(new Set(transactions.map(t => t.counterparty_jurisdiction)))
  const data = allJurisdictions.map(j => {
    const isNew = !baselineCorridors.includes(j)
    const weeklyVolumes = weeks.map((_, wi) => {
      const endW = new Date(endDate); endW.setDate(endW.getDate() - (11 - wi) * 7)
      const startW = new Date(endW); startW.setDate(startW.getDate() - 7)
      return transactions.filter(t => t.counterparty_jurisdiction === j && t.date >= startW.toISOString().split('T')[0] && t.date < endW.toISOString().split('T')[0]).reduce((s, t) => s + t.amount, 0)
    })
    return { jurisdiction: j, isNew, weeklyVolumes, maxVol: Math.max(...weeklyVolumes) }
  })
  return { data, weeks }
}

function buildTxTypeCounts(transactions: Transaction[]) {
  const counts: Record<string, number> = { wire: 0, ach: 0, check: 0, fx: 0 }
  for (const tx of transactions) counts[tx.transaction_type] = (counts[tx.transaction_type] || 0) + 1
  return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }))
}

function buildDriftScore(transactions: Transaction[]) {
  const endDate = new Date('2024-12-01')
  return Array.from({ length: 12 }, (_, i) => {
    const w = 12 - i
    const endW = new Date(endDate); endW.setDate(endW.getDate() - (w - 1) * 7)
    const startW = new Date(endW); startW.setDate(startW.getDate() - 7)
    const weekTx = transactions.filter(t => t.date >= startW.toISOString().split('T')[0] && t.date < endW.toISOString().split('T')[0])
    let score = 0
    if (weekTx.length > 0) {
      const featureSum = weekTx.reduce((s, t) => { const vals = Object.values(t.ml_features); return s + vals.reduce((a, b) => a + Math.abs(b), 0) / vals.length }, 0)
      score = Math.min(100, (featureSum / weekTx.length) * 6)
    }
    return { week: `W${13 - w}`, score: Math.round(score) }
  })
}

function interpolate(c1: string, c2: string, t: number): string {
  const h = (s: string) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)]
  const [r1, g1, b1] = h(c1); const [r2, g2, b2] = h(c2)
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`
}

function CorridorHeatmap({ data }: { data: ReturnType<typeof buildCorridorHeatmap> }) {
  const globalMax = Math.max(...data.data.flatMap(d => d.weeklyVolumes), 1)
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="pr-3 pb-1 text-left text-[10px] text-[#828282] font-medium min-w-[120px]">Jurisdiction</th>
            {data.weeks.map(w => <th key={w} className="px-1 pb-1 text-[10px] text-[#828282] font-medium w-8 text-center">{w}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.data.map(row => (
            <tr key={row.jurisdiction}>
              <td className="pr-3 py-0.5 whitespace-nowrap text-[11px]" style={{ color: row.isNew ? '#F5A800' : '#011E41', fontWeight: row.isNew ? 600 : 400 }}>
                {row.isNew ? '★ ' : ''}{row.jurisdiction}
              </td>
              {row.weeklyVolumes.map((vol, wi) => (
                <td key={wi} title={`$${vol.toLocaleString()}`}
                  className="px-0.5 py-0.5"
                  style={{
                    width: 28,
                  }}>
                  <div
                    style={{
                      width: 26, height: 18,
                      backgroundColor: interpolate('#FFFFFF', '#011E41', vol / globalMax),
                      border: row.isNew ? '1px solid #F5A800' : '1px solid #F0F0F0',
                      borderRadius: 2,
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Gradient legend */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px] text-[#828282]">No activity</span>
        <div className="flex-1 max-w-[120px] h-2 rounded" style={{ background: 'linear-gradient(to right, #FFFFFF, #011E41)', border: '1px solid #E0E0E0' }} />
        <span className="text-[10px] text-[#828282]">High volume</span>
      </div>
    </div>
  )
}
