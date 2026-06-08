'use client'

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Zap, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Transaction } from '@/types/transaction'
import type { Customer } from '@/types/customer'
import { formatCurrency, getRiskColor, FEATURE_LABELS } from '@/lib/utils'
import RiskBadge from '@/components/ui/RiskBadge'

interface Props {
  transactions: Transaction[]
  customerMap: Record<string, Customer>
  rulesOnlyCount: number
  confirmedBothCount: number
  modelOnlyCount: number
  agreementRate: number
}

export default function ComparisonPanel({
  transactions, customerMap, rulesOnlyCount, confirmedBothCount, modelOnlyCount, agreementRate,
}: Props) {
  const router = useRouter()
  const rulesTx = transactions.filter(t => t.rule_fired)
  const modelTx = transactions.filter(t => t.ml_score > 70)
  const ruleFalsePosCount = rulesTx.filter(t => !t.is_true_positive).length
  const modelOnlyInList = modelTx.filter(t => !t.rule_fired).length
  const bothIds = new Set(rulesTx.filter(t => t.ml_score > 70).map(t => t.id))

  const rulesListRef = useRef<HTMLDivElement>(null)
  const modelListRef = useRef<HTMLDivElement>(null)
  const [connectors, setConnectors] = useState<{ y1: number; y2: number }[]>([])

  useEffect(() => {
    const lines: { y1: number; y2: number }[] = []
    if (!rulesListRef.current || !modelListRef.current) return
    const rulesRect = rulesListRef.current.getBoundingClientRect()
    const modelRect = modelListRef.current.getBoundingClientRect()
    for (const ruleRow of Array.from(rulesListRef.current.querySelectorAll('[data-txid]'))) {
      const txId = ruleRow.getAttribute('data-txid')
      if (!txId || !bothIds.has(txId)) continue
      const modelRow = modelListRef.current.querySelector(`[data-txid="${txId}"]`)
      if (!modelRow) continue
      const rr = ruleRow.getBoundingClientRect()
      const mr = modelRow.getBoundingClientRect()
      lines.push({ y1: rr.top - rulesRect.top + rr.height / 2, y2: mr.top - modelRect.top + mr.height / 2 })
    }
    setConnectors(lines)
  }, [transactions]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalFlagged = rulesTx.length + modelOnlyInList

  return (
    <div className="space-y-5">
      {/* ── Visual scoreboard ──────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #011E41 0%, #01152E 100%)' }}>
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-white/[0.07]">
          <h2 className="text-base font-bold text-white mb-1">Rules vs Behavioral Model — Side by Side</h2>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Same transactions. The overlap is {agreementRate}%. The gap in both directions is the problem static rules cannot solve.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 divide-x divide-white/[0.07]">
          {[
            { icon: AlertTriangle, value: rulesOnlyCount, label: 'Rules-Only', sub: 'Estimated false positives', color: '#F5A800' },
            { icon: CheckCircle2, value: confirmedBothCount, label: 'Confirmed by Both', sub: 'Highest confidence', color: '#05AB8C' },
            { icon: Zap, value: modelOnlyCount, label: 'Model-Only', sub: 'Rules missed these', color: '#E5376B' },
            { icon: ArrowRight, value: `${agreementRate}%`, label: 'Agreement Rate', sub: 'Rules + model overlap', color: 'white' },
          ].map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }} className="px-6 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded-md flex items-center justify-center" style={{ backgroundColor: s.color + '20' }}>
                    <Icon size={12} style={{ color: s.color }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</span>
                </div>
                <div className="tabular-nums font-bold text-white leading-none mb-1" style={{ fontSize: 36 }}>
                  {s.value}
                </div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.sub}</div>
              </motion.div>
            )
          })}
        </div>

        {/* Visual proportion bar */}
        <div className="px-6 py-3 border-t border-white/[0.07]">
          <div className="flex items-center gap-2 text-xs text-white/40 mb-1.5">
            <span>Composition of {totalFlagged} total flagged transactions</span>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
            {[
              { w: totalFlagged > 0 ? (rulesOnlyCount / totalFlagged) * 100 : 0, color: '#F5A800' },
              { w: totalFlagged > 0 ? (confirmedBothCount / totalFlagged) * 100 : 0, color: '#05AB8C' },
              { w: totalFlagged > 0 ? (modelOnlyCount / totalFlagged) * 100 : 0, color: '#E5376B' },
            ].map((seg, i) => (
              <motion.div key={i} initial={{ width: 0 }} animate={{ width: `${seg.w}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 + i * 0.1 }}
                style={{ backgroundColor: seg.color, height: '100%' }} />
            ))}
          </div>
          <div className="flex gap-4 mt-1.5">
            {[
              { label: 'Rules-only', color: '#F5A800' },
              { label: 'Both', color: '#05AB8C' },
              { label: 'Model-only', color: '#E5376B' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Two columns ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-5 relative">
        {/* SVG connector lines */}
        <svg aria-hidden style={{
          position: 'absolute', top: 0, left: '50%', width: 0,
          height: '100%', overflow: 'visible', pointerEvents: 'none', zIndex: 10,
        }}>
          {connectors.map((c, i) => (
            <motion.line key={i} x1={-20} y1={c.y1} x2={20} y2={c.y2}
              stroke="#05AB8C" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.5}
              initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ delay: 0.8 + i * 0.05 }} />
          ))}
        </svg>

        {/* Left — Rules */}
        <div className="rounded-xl border border-[#E0E0E0] overflow-hidden shadow-card bg-white">
          <div className="px-4 py-3 border-b border-[#E0E0E0] bg-[#F8F9FB] flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#011E41]">Static Rules Engine</h3>
              <p className="text-xs text-[#828282] mt-0.5">Threshold-based · jurisdiction-flagged · amount-triggered</p>
            </div>
            <span className="text-xs font-bold tabular-nums" style={{ color: '#E5376B' }}>{rulesTx.length}</span>
          </div>
          <div ref={rulesListRef} className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
            {rulesTx.map((tx, idx) => {
              const customer = customerMap[tx.customer_id]
              const isFP = !tx.is_true_positive
              const isConfirmed = tx.ml_score > 70
              return (
                <motion.div key={tx.id} data-txid={tx.id}
                  initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.4) }}
                  onClick={() => router.push(`/transactions?selected=${tx.id}`)}
                  className="flex items-center justify-between px-4 py-2.5 border-b border-[#F5F5F5] cursor-pointer hover:bg-[#FAFAFA] transition-colors"
                  style={{
                    backgroundColor: isConfirmed ? 'rgba(5,171,140,0.05)' : isFP ? 'rgba(245,168,0,0.06)' : 'white',
                    borderLeft: `3px solid ${isConfirmed ? '#05AB8C' : isFP ? '#F5A800' : '#E0E0E0'}`,
                  }}>
                  <div className="min-w-0">
                    <div className="font-medium text-[#011E41] text-sm truncate">{customer?.name || tx.customer_id}</div>
                    <div className="text-xs text-[#828282] mt-0.5">{tx.rule_label}</div>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <div className="tabular-nums text-sm font-semibold text-[#011E41]">{formatCurrency(tx.amount)}</div>
                    {isFP && !isConfirmed && <div className="text-[10px] font-medium text-[#F5A800]">Est. false positive</div>}
                    {isConfirmed && <div className="text-[10px] font-medium text-[#05AB8C]">Model confirmed</div>}
                  </div>
                </motion.div>
              )
            })}
          </div>
          <div className="px-4 py-2.5 border-t border-[#E0E0E0] bg-[#F8F9FB] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#E5376B]">{ruleFalsePosCount} of {rulesTx.length} est. false positive</span>
            <span className="text-xs text-[#828282]">{Math.round((ruleFalsePosCount / Math.max(rulesTx.length, 1)) * 100)}% FP rate</span>
          </div>
        </div>

        {/* Right — Model */}
        <div className="rounded-xl border border-[#E0E0E0] overflow-hidden shadow-card bg-white">
          <div className="px-4 py-3 border-b border-[#E0E0E0] bg-[#F8F9FB] flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#011E41]">Adaptive Behavioral Model</h3>
              <p className="text-xs text-[#828282] mt-0.5">Peer baseline · behavioral drift · feature attribution</p>
            </div>
            <span className="text-xs font-bold tabular-nums" style={{ color: '#05AB8C' }}>{modelTx.length}</span>
          </div>
          <div ref={modelListRef} className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
            {modelTx.map((tx, idx) => {
              const customer = customerMap[tx.customer_id]
              const isModelOnly = !tx.rule_fired
              const featureEntries = Object.entries(tx.ml_features) as [keyof typeof tx.ml_features, number][]
              featureEntries.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
              const topFeature = FEATURE_LABELS[featureEntries[0]?.[0]] || ''
              return (
                <motion.div key={tx.id} data-txid={tx.id}
                  initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.4) }}
                  onClick={() => router.push(`/transactions?selected=${tx.id}`)}
                  className="flex items-center justify-between px-4 py-2.5 border-b border-[#F5F5F5] cursor-pointer hover:bg-[#FAFAFA] transition-colors"
                  style={{
                    backgroundColor: isModelOnly ? 'rgba(5,171,140,0.05)' : 'white',
                    borderLeft: `3px solid ${isModelOnly ? '#05AB8C' : '#E0E0E0'}`,
                  }}>
                  <div className="min-w-0">
                    <div className="font-medium text-[#011E41] text-sm truncate">{customer?.name || tx.customer_id}</div>
                    <div className="text-xs text-[#828282] mt-0.5">{topFeature}</div>
                  </div>
                  <div className="flex items-center gap-2.5 ml-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="tabular-nums text-sm font-semibold text-[#011E41]">{formatCurrency(tx.amount)}</div>
                      {isModelOnly && <div className="text-[10px] font-medium text-[#05AB8C]">Model only ↑</div>}
                    </div>
                    <RiskBadge score={tx.ml_score} size="sm" />
                  </div>
                </motion.div>
              )
            })}
          </div>
          <div className="px-4 py-2.5 border-t border-[#E0E0E0] bg-[#F8F9FB] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#05AB8C]">{modelOnlyInList} not caught by rules</span>
            <span className="text-xs text-[#828282]">click any row to inspect</span>
          </div>
        </div>
      </div>
    </div>
  )
}
