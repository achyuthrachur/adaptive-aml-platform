'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useInView, animate, useMotionValue, useTransform } from 'framer-motion'
import { AlertTriangle, Eye, Cpu, Network, ArrowRight, TrendingUp, Activity } from 'lucide-react'
import OverviewCharts from './OverviewCharts'

// ── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, duration = 1.8 }: { to: number; duration?: number }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, v => Math.round(v).toLocaleString())
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView) return
    const c = animate(count, to, { duration, ease: [0.16, 1, 0.3, 1] })
    return c.stop
  }, [inView, to, count, duration])
  return <motion.span ref={ref}>{rounded}</motion.span>
}

interface Props {
  rulesAlerts: number; falsePosCount: number; modelOnlyCount: number
  highRiskClusters: number; ruleCaughtPct: number
  weekBuckets: { week: string; rule_only: number; confirmed: number; model_only: number }[]
  histogramData: { range: string; count: number }[]
  modelOnlyTotal: number
  topAlerts: { id: string; customer: string; segment: string; amount: number; score: number; feature: string; date: string }[]
}

const METRICS = (p: Props) => [
  { label: 'Rules Alerts (30d)', value: p.rulesAlerts, icon: AlertTriangle, color: '#F5A800', sub: 'transactions triggered a rule' },
  { label: 'Est. False Positives', value: p.falsePosCount, icon: TrendingUp, color: '#E5376B', sub: `${p.rulesAlerts > 0 ? Math.round((p.falsePosCount / p.rulesAlerts) * 100) : 0}% of all rule alerts` },
  { label: 'Model-Only Detections', value: p.modelOnlyCount, icon: Eye, color: '#05AB8C', sub: 'rules missed these entirely' },
  { label: 'Network Risk Clusters', value: p.highRiskClusters, icon: Network, color: '#0075C9', sub: 'layering · hub · sanctioned-adjacent' },
]

export default function OverviewClient(props: Props) {
  const router = useRouter()
  const fpRate = props.rulesAlerts > 0 ? Math.round((props.falsePosCount / props.rulesAlerts) * 100) : 0
  const metrics = METRICS(props)

  return (
    <div className="space-y-5">
      {/* ── Dark metric header ─────────────────────────────────── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #011E41 0%, #01152E 100%)' }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-2 w-2 rounded-full bg-[#05AB8C]"
            />
            <span className="text-xs text-white/50 font-medium">Live analysis · Dataset as of Dec 2024 · 1,247 transactions</span>
          </div>
          <span className="text-xs text-white/30">Adaptive AML Intelligence Platform</span>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-4 divide-x divide-white/[0.07]">
          {metrics.map((m, i) => {
            const Icon = m.icon
            return (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="px-6 py-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: m.color + '20' }}>
                    <Icon size={14} style={{ color: m.color }} />
                  </div>
                  <span className="text-xs text-white/50 font-medium">{m.label}</span>
                </div>
                <div className="tabular-nums font-bold text-white leading-none mb-1.5" style={{ fontSize: 42 }}>
                  <Counter to={m.value} />
                </div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{m.sub}</div>
              </motion.div>
            )
          })}
        </div>

        {/* Alert rate strip */}
        <div className="px-6 py-3 border-t border-white/[0.07] flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">False positive rate:</span>
            <div className="h-1.5 w-32 rounded-full overflow-hidden bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${fpRate}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                className="h-full rounded-full bg-[#E5376B]"
              />
            </div>
            <span className="text-xs font-semibold" style={{ color: '#E5376B' }}>{fpRate}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">Model catch rate:</span>
            <div className="h-1.5 w-32 rounded-full overflow-hidden bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${props.ruleCaughtPct}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.6 }}
                className="h-full rounded-full bg-[#05AB8C]"
              />
            </div>
            <span className="text-xs font-semibold" style={{ color: '#05AB8C' }}>{props.ruleCaughtPct}%</span>
          </div>
        </div>
      </div>

      {/* ── Charts ─────────────────────────────────────────────── */}
      <OverviewCharts
        weekBuckets={props.weekBuckets}
        histogramData={props.histogramData}
        modelOnlyAnnotation={props.modelOnlyTotal}
        ruleCaughtPct={props.ruleCaughtPct}
      />

      {/* ── Bottom row: Top Alerts + Model steps ───────────────── */}
      <div className="grid grid-cols-3 gap-5">
        {/* Top high-risk alerts */}
        <div className="col-span-2 rounded-xl border border-[#E0E0E0] bg-white overflow-hidden shadow-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F0F0]">
            <div>
              <h3 className="text-sm font-semibold text-[#011E41]">Top Risk Alerts</h3>
              <p className="text-xs text-[#828282] mt-0.5">Highest behavioral risk scores across all customers</p>
            </div>
            <button
              onClick={() => router.push('/transactions')}
              className="flex items-center gap-1.5 text-xs font-medium text-[#0075C9] hover:text-[#0050AD] transition-colors"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8F9FB] border-b border-[#F0F0F0]">
                {['Customer', 'Amount', 'Score', 'Top Signal', 'Date', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-[#828282]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {props.topAlerts.map((a, i) => {
                const scoreColor = a.score > 85 ? '#E5376B' : a.score > 70 ? '#F5A800' : '#05AB8C'
                return (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.06 }}
                    onClick={() => router.push(`/transactions?selected=${a.id}`)}
                    className="border-b border-[#F5F5F5] cursor-pointer hover:bg-[#F8F9FB] transition-colors"
                    style={{ borderLeft: `3px solid ${scoreColor}` }}
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-[#011E41] text-sm">{a.customer}</div>
                      <div className="text-xs text-[#828282]">{a.segment}</div>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-sm font-medium text-[#011E41]">
                      ${a.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-[#F0F0F0] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${a.score}%` }}
                            transition={{ duration: 0.8, delay: 0.4 + i * 0.06 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: scoreColor }}
                          />
                        </div>
                        <span className="tabular-nums text-sm font-bold" style={{ color: scoreColor }}>{a.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-[#828282]">{a.feature}</td>
                    <td className="px-4 py-2.5 text-xs text-[#828282]">{a.date}</td>
                    <td className="px-4 py-2.5">
                      <ArrowRight size={13} className="text-[#BDBDBD]" />
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* How model works */}
        <div className="space-y-3">
          <div className="rounded-xl border border-[#E0E0E0] bg-white p-5 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={14} className="text-[#828282]" />
              <h3 className="text-sm font-semibold text-[#011E41]">Detection pipeline</h3>
            </div>
            <div className="space-y-3">
              {[
                { step: '01', label: 'Build 90-day baseline', color: '#0075C9' },
                { step: '02', label: 'Score 6 behavioral features', color: '#05AB8C' },
                { step: '03', label: 'Flag deviations > 70', color: '#F5A800' },
                { step: '04', label: 'Map transaction network', color: '#B14FC5' },
                { step: '05', label: 'Generate explainable alert', color: '#E5376B' },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.07 }}
                  className="flex items-center gap-3"
                >
                  <span className="tabular-nums text-xs font-bold w-6 flex-shrink-0" style={{ color: item.color }}>{item.step}</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: item.color + '30' }} />
                  <span className="text-xs text-[#4F4F4F]">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="rounded-xl overflow-hidden shadow-card"
            style={{ background: 'linear-gradient(135deg, #011E41, #01152E)' }}>
            <div className="p-5">
              <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Today&apos;s summary</div>
              <div className="space-y-2.5">
                {[
                  { label: 'High risk (>85)', value: props.topAlerts.filter(a => a.score > 85).length, color: '#E5376B' },
                  { label: 'Medium risk (70–85)', value: props.topAlerts.filter(a => a.score >= 70 && a.score <= 85).length, color: '#F5A800' },
                  { label: 'Network flags', value: props.highRiskClusters, color: '#0075C9' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{row.label}</span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
