'use client'

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { GitCompare, AlertTriangle, CheckCircle, Zap } from 'lucide-react'
import type { Transaction } from '@/types/transaction'
import type { Customer } from '@/types/customer'
import { formatCurrency, getRiskColor, FEATURE_LABELS } from '@/lib/utils'
import ExplainerBanner from '@/components/ui/ExplainerBanner'
import RiskBadge from '@/components/ui/RiskBadge'
import { Separator } from '@/components/ui/separator'

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
  const rulesTx = transactions.filter(t => t.rule_fired)
  const modelTx = transactions.filter(t => t.ml_score > 70)
  const ruleFalsePosCount = rulesTx.filter(t => !t.is_true_positive).length
  const modelOnlyInList = modelTx.filter(t => !t.rule_fired).length

  const rulesListRef = useRef<HTMLDivElement>(null)
  const modelListRef = useRef<HTMLDivElement>(null)
  const [connectors, setConnectors] = useState<{ y1: number; y2: number }[]>([])

  const bothIds = new Set(rulesTx.filter(t => t.ml_score > 70).map(t => t.id))

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
      lines.push({
        y1: rr.top - rulesRect.top + rr.height / 2,
        y2: mr.top - modelRect.top + mr.height / 2,
      })
    }
    setConnectors(lines)
  }, [transactions]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <ExplainerBanner
        title="Rules vs Model — side by side"
        insight="This view proves the core argument. The left column shows every transaction a static rule flagged. The right shows every transaction the behavioral model flagged. The overlap is surprisingly small — and the gap in both directions is the problem."
        pillars={[
          { icon: AlertTriangle, title: `${rulesOnlyCount} Rules-Only`, body: 'Flagged by a rule but model rates as low risk. Estimated false positives consuming analyst time.', color: '#F5A800' },
          { icon: CheckCircle, title: `${confirmedBothCount} Confirmed by Both`, body: 'Both methods agree. These are the highest-confidence alerts and should be prioritized.', color: '#05AB8C' },
          { icon: Zap, title: `${modelOnlyCount} Model-Only`, body: 'High behavioral risk with no rule firing. These would have been invisible in a rules-only system.', color: '#E5376B' },
        ]}
      />

      {/* Stats bar */}
      <div className="rounded-lg mb-5 overflow-hidden" style={{ background: 'linear-gradient(135deg, #011E41 0%, #01152E 100%)' }}>
        <div className="grid grid-cols-4">
          {[
            { value: rulesOnlyCount, label: 'Rules-Only', sub: 'Est. false positives', color: '#F5A800' },
            { value: confirmedBothCount, label: 'Confirmed by Both', sub: 'High confidence', color: '#05AB8C' },
            { value: modelOnlyCount, label: 'Model-Only', sub: 'Rules missed these', color: '#0075C9' },
            { value: `${agreementRate}%`, label: 'Agreement Rate', sub: 'Rules + model overlap', color: 'white' },
          ].map((stat, i) => (
            <div key={i} className="px-6 py-4 relative">
              {i > 0 && <div className="absolute left-0 top-3 bottom-3 w-px bg-white/10" />}
              <div className="tabular-nums text-3xl font-bold leading-none mb-1.5" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-sm font-semibold text-white">{stat.label}</div>
              <div className="text-xs text-white/50 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-2 gap-5 relative">
        {/* SVG connector lines overlay */}
        <svg
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            width: 0,
            height: '100%',
            overflow: 'visible',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {connectors.map((c, i) => (
            <line
              key={i}
              x1={-20} y1={c.y1}
              x2={20} y2={c.y2}
              stroke="#05AB8C"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              opacity={0.5}
            />
          ))}
        </svg>

        {/* Left — Rules */}
        <div className="rounded-lg border border-[#E0E0E0] overflow-hidden shadow-card bg-white">
          <div className="px-4 py-3 border-b border-[#E0E0E0] bg-[#F8F9FB]">
            <h3 className="text-sm font-semibold text-[#011E41]">Static Rules Engine</h3>
            <p className="text-xs text-[#828282] mt-0.5">Threshold-based · jurisdiction-flagged · amount-triggered</p>
          </div>
          <div ref={rulesListRef} className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 380px)' }}>
            {rulesTx.map(tx => {
              const customer = customerMap[tx.customer_id]
              const isFP = !tx.is_true_positive
              const isConfirmed = tx.ml_score > 70
              return (
                <div
                  key={tx.id}
                  data-txid={tx.id}
                  className="flex items-center justify-between px-4 py-2.5 border-b border-[#F5F5F5] text-sm transition-colors hover:bg-[#FAFAFA]"
                  style={{
                    backgroundColor: isConfirmed
                      ? 'rgba(5,171,140,0.06)'
                      : isFP ? 'rgba(245,168,0,0.08)' : 'white',
                  }}
                >
                  <div className="min-w-0">
                    <div className="font-medium text-[#011E41] truncate">{customer?.name || tx.customer_id}</div>
                    <div className="text-xs text-[#828282] mt-0.5">{tx.rule_label}</div>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <div className="tabular-nums font-semibold text-[#011E41]">{formatCurrency(tx.amount)}</div>
                    {isFP && !isConfirmed && <div className="text-2xs text-[#F5A800] font-medium">Est. false positive</div>}
                    {isConfirmed && <div className="text-2xs text-[#05AB8C] font-medium">Confirmed by model</div>}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="px-4 py-2.5 border-t border-[#E0E0E0] bg-[#F8F9FB]">
            <span className="text-xs font-medium text-[#E5376B]">
              {ruleFalsePosCount} of {rulesTx.length} alerts estimated false positive
            </span>
          </div>
        </div>

        {/* Right — Model */}
        <div className="rounded-lg border border-[#E0E0E0] overflow-hidden shadow-card bg-white">
          <div className="px-4 py-3 border-b border-[#E0E0E0] bg-[#F8F9FB]">
            <h3 className="text-sm font-semibold text-[#011E41]">Adaptive Behavioral Model</h3>
            <p className="text-xs text-[#828282] mt-0.5">Peer group baseline · behavioral drift · feature attribution</p>
          </div>
          <div ref={modelListRef} className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 380px)' }}>
            {modelTx.map(tx => {
              const customer = customerMap[tx.customer_id]
              const isModelOnly = !tx.rule_fired
              const featureEntries = Object.entries(tx.ml_features) as [keyof typeof tx.ml_features, number][]
              featureEntries.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
              const topFeature = FEATURE_LABELS[featureEntries[0]?.[0]] || ''
              return (
                <div
                  key={tx.id}
                  data-txid={tx.id}
                  className="flex items-center justify-between px-4 py-2.5 border-b border-[#F5F5F5] text-sm transition-colors hover:bg-[#FAFAFA]"
                  style={{ backgroundColor: isModelOnly ? 'rgba(5,171,140,0.06)' : 'white' }}
                >
                  <div className="min-w-0">
                    <div className="font-medium text-[#011E41] truncate">{customer?.name || tx.customer_id}</div>
                    <div className="text-xs text-[#828282] mt-0.5">{topFeature}</div>
                  </div>
                  <div className="flex items-center gap-2.5 ml-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="tabular-nums font-semibold text-[#011E41]">{formatCurrency(tx.amount)}</div>
                      {isModelOnly && <div className="text-2xs text-[#05AB8C] font-medium">Model only ↑</div>}
                    </div>
                    <RiskBadge score={tx.ml_score} size="sm" />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="px-4 py-2.5 border-t border-[#E0E0E0] bg-[#F8F9FB]">
            <span className="text-xs font-medium text-[#05AB8C]">
              {modelOnlyInList} risks identified not caught by rules
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
