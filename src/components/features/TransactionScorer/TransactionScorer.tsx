'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { MousePointerClick, ChevronLeft, ChevronRight, ChevronDown, Info, ArrowUpRight } from 'lucide-react'
import type { Transaction } from '@/types/transaction'
import type { Customer } from '@/types/customer'
import { formatCurrency, formatDate, getRiskColor, FEATURE_LABELS, FEATURE_DESCRIPTIONS } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'

const SEGMENT_LABELS: Record<string, string> = {
  private_wealth: 'Private Wealth', corporate_treasury: 'Corp Treasury',
  correspondent_banking: 'Correspondent', retail: 'Retail',
}
const PAGE_SIZE = 20

// ── Circular score gauge ─────────────────────────────────────────────────────
function ScoreGauge({ score }: { score: number }) {
  const color = getRiskColor(score)
  const r = 54
  const circumference = 2 * Math.PI * r
  const arcLength = circumference * 0.75 // 270° arc
  const dash = (score / 100) * arcLength

  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(135deg)' }}>
        {/* Track */}
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="10"
          strokeDasharray={`${arcLength} ${circumference - arcLength}`} strokeLinecap="round" />
        {/* Value */}
        <motion.circle
          cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${dash} ${circumference - dash}` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="tabular-nums font-bold leading-none"
          style={{ fontSize: 38, color }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-[#828282] mt-0.5">/ 100</span>
      </div>
    </div>
  )
}

interface Props { transactions: Transaction[]; customerMap: Record<string, Customer> }

export default function TransactionScorer({ transactions, customerMap }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('selected')
  const [segmentFilter, setSegmentFilter] = useState('all')
  const [directionFilter, setDirectionFilter] = useState('all')
  const [ruleFiredFilter, setRuleFiredFilter] = useState('all')
  const [scoreMin, setScoreMin] = useState(0)
  const [scoreMax, setScoreMax] = useState(100)
  const [page, setPage] = useState(0)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const selectedRowRef = useRef<HTMLTableRowElement>(null)

  const filtered = transactions.filter(tx => {
    const c = customerMap[tx.customer_id]
    if (segmentFilter !== 'all' && c?.segment !== segmentFilter) return false
    if (directionFilter !== 'all' && tx.direction !== directionFilter) return false
    if (ruleFiredFilter === 'yes' && !tx.rule_fired) return false
    if (ruleFiredFilter === 'no' && tx.rule_fired) return false
    if (tx.ml_score < scoreMin || tx.ml_score > scoreMax) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  useEffect(() => {
    if (selectedId) {
      const tx = transactions.find(t => t.id === selectedId)
      if (tx) { setSelectedTx(tx); const idx = filtered.findIndex(t => t.id === selectedId); if (idx >= 0) setPage(Math.floor(idx / PAGE_SIZE)) }
    }
  }, [selectedId, transactions]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { selectedRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }, [selectedTx])

  const handleSelect = useCallback((tx: Transaction) => {
    setSelectedTx(tx); router.push(`/transactions?selected=${tx.id}`, { scroll: false })
  }, [router])

  return (
    <div className="flex gap-0 h-[calc(100vh-52px-48px)] min-h-0 -mx-6 -my-6">
      {/* Left panel */}
      <div className="w-[400px] min-w-[400px] flex flex-col border-r border-[#E0E0E0] bg-white px-4 pt-4 pb-2">
        {/* Filters */}
        <div className="space-y-2.5 pb-3 border-b border-[#F0F0F0] mb-3">
          <div className="flex gap-2">
            <Select value={segmentFilter} onValueChange={v => { setSegmentFilter(v); setPage(0) }}>
              <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Segments</SelectItem>
                <SelectItem value="private_wealth">Private Wealth</SelectItem>
                <SelectItem value="corporate_treasury">Corp Treasury</SelectItem>
                <SelectItem value="correspondent_banking">Correspondent</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ruleFiredFilter} onValueChange={v => { setRuleFiredFilter(v); setPage(0) }}>
              <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">Rule Fired</SelectItem>
                <SelectItem value="no">No Rule</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#828282]">
            <span className="flex-shrink-0 w-20">Score {scoreMin}–{scoreMax}</span>
            <input type="range" min={0} max={100} value={scoreMin} onChange={e => setScoreMin(+e.target.value)} className="flex-1 accent-[#011E41] h-1" />
            <input type="range" min={0} max={100} value={scoreMax} onChange={e => setScoreMax(+e.target.value)} className="flex-1 accent-[#011E41] h-1" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#828282] tabular-nums">{filtered.length} transactions</span>
            <div className="flex gap-1.5">
              {[{ label: 'High', min: 71, color: '#E5376B' }, { label: 'Med', min: 40, max: 70, color: '#F5A800' }, { label: 'Low', max: 39, color: '#05AB8C' }].map(b => {
                const count = filtered.filter(t => (b.min === undefined || t.ml_score >= b.min) && (b.max === undefined || t.ml_score <= b.max)).length
                return (
                  <span key={b.label} className="text-xs tabular-nums px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: b.color + '18', color: b.color }}>
                    {b.label} {count}
                  </span>
                )
              })}
            </div>
          </div>
        </div>

        {/* Transaction list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-white z-10 border-b-2 border-[#E0E0E0]">
              <tr>
                {['', 'Date', 'Customer', 'Amount', 'Score'].map(h => (
                  <th key={h} className="px-2 py-2.5 text-left text-[11px] font-semibold text-[#828282]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map(tx => {
                const isSelected = selectedTx?.id === tx.id
                const customer = customerMap[tx.customer_id]
                const color = getRiskColor(tx.ml_score)
                return (
                  <tr key={tx.id} ref={isSelected ? selectedRowRef : null}
                    onClick={() => handleSelect(tx)}
                    className="border-b border-[#F5F5F5] cursor-pointer transition-colors duration-75 hover:bg-[#F8F9FB]"
                    style={{
                      backgroundColor: isSelected ? 'rgba(245,168,0,0.08)' : undefined,
                      borderLeft: isSelected ? '3px solid #F5A800' : '3px solid transparent',
                    }}>
                    {/* Risk dot */}
                    <td className="pl-2 pr-1 py-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-[#828282]">{tx.date}</td>
                    <td className="px-2 py-2 max-w-[90px] overflow-hidden text-ellipsis whitespace-nowrap font-medium text-[#011E41]">
                      {customer?.name?.split(' ')[0] || tx.customer_id}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap tabular-nums text-[#011E41]">{formatCurrency(tx.amount)}</td>
                    <td className="px-2 py-2">
                      <span className="font-bold tabular-nums" style={{ color }}>{tx.ml_score}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-2 border-t border-[#F0F0F0]">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
            <ChevronLeft size={15} />
          </Button>
          <span className="text-xs text-[#828282] tabular-nums">Page {page + 1} / {Math.max(1, totalPages)}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
            <ChevronRight size={15} />
          </Button>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-y-auto bg-[#F4F6F9] p-6">
        <AnimatePresence mode="wait">
          {!selectedTx ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-[#BDBDBD] gap-4">
              <div className="h-20 w-20 rounded-2xl bg-white border border-[#E0E0E0] shadow-card flex items-center justify-center">
                <MousePointerClick size={32} strokeWidth={1.2} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#828282]">Select a transaction</p>
                <p className="text-xs mt-1">to view its behavioral risk breakdown</p>
              </div>
            </motion.div>
          ) : (
            <motion.div key={selectedTx.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <TransactionDetail tx={selectedTx} customer={customerMap[selectedTx.customer_id]} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function TransactionDetail({ tx, customer }: { tx: Transaction; customer?: Customer }) {
  const router = useRouter()
  const [explainerOpen, setExplainerOpen] = useState(false)
  const riskColor = getRiskColor(tx.ml_score)
  const riskLabel = tx.ml_score > 70 ? 'High Risk' : tx.ml_score >= 40 ? 'Medium Risk' : 'Low Risk'

  const features = Object.entries(tx.ml_features) as [keyof typeof tx.ml_features, number][]
  const sortedFeatures = [...features].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
  const maxMag = Math.max(...features.map(([, v]) => Math.abs(v)), 1)
  const positiveFeatures = sortedFeatures.filter(([, v]) => v > 0).slice(0, 2)
  const corridorNegative = tx.ml_features.corridor_familiarity < 0

  return (
    <div className="max-w-[580px] space-y-4">
      {/* Score card */}
      <div className="rounded-xl bg-white border border-[#E0E0E0] shadow-card overflow-hidden">
        <div className="flex items-center gap-6 p-6">
          {/* Gauge */}
          <ScoreGauge score={tx.ml_score} />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="font-mono text-xs text-[#BDBDBD] mb-1">{tx.id}</div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {customer && <span className="font-bold text-[#011E41] text-lg">{customer.name}</span>}
              {customer && (
                <span className="bg-[#EEF2FF] text-[#4338CA] px-2 py-0.5 rounded text-xs font-medium">
                  {SEGMENT_LABELS[customer.segment]}
                </span>
              )}
            </div>
            <div className="flex gap-4 text-sm mb-3 flex-wrap">
              <span className="tabular-nums font-semibold text-[#011E41]">{formatCurrency(tx.amount)}</span>
              <span className="capitalize font-medium" style={{ color: tx.direction === 'outbound' ? '#E5376B' : '#05AB8C' }}>{tx.direction}</span>
              <span className="text-[#828282]">{formatDate(tx.date)}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: riskColor + '18', color: riskColor }}>
                {riskLabel}
              </span>
              {tx.rule_fired && (
                <span className="bg-[#FEE2E2] text-[#DC2626] px-3 py-1 rounded-full text-xs font-medium">{tx.rule_label || 'Rule Fired'}</span>
              )}
              {!tx.rule_fired && tx.ml_score > 70 && (
                <span className="bg-[#D1F5EF] text-[#0C7876] px-3 py-1 rounded-full text-xs font-medium">Model-only detection</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SHAP bars */}
      <div className="rounded-xl bg-white border border-[#E0E0E0] shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#011E41]">Why This Score — Feature Breakdown</h3>
        </div>
        <div className="flex justify-between text-[10px] text-[#828282] mb-3 pb-2 border-b border-[#F0F0F0]">
          <span className="text-[#05AB8C] font-medium">← Reduces risk</span>
          <span className="text-[#E5376B] font-medium">Increases risk →</span>
        </div>
        <div className="space-y-4">
          {sortedFeatures.map(([key, value]) => {
            const isPos = value >= 0
            const barPct = (Math.abs(value) / maxMag) * 44
            return (
              <div key={key}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs font-semibold text-[#011E41]">{FEATURE_LABELS[key] || key}</span>
                  <span className="text-xs font-bold tabular-nums" style={{ color: isPos ? '#E5376B' : '#05AB8C' }}>
                    {value > 0 ? '+' : ''}{value}
                  </span>
                </div>
                <div className="text-[10px] text-[#828282] mb-1.5">{FEATURE_DESCRIPTIONS[key]}</div>
                <div className="flex h-3 items-center gap-0">
                  <div className="w-[44%] flex justify-end">
                    {!isPos && (
                      <motion.div initial={{ width: 0 }} animate={{ width: `${barPct}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                        className="h-2.5 rounded-l-sm"
                        style={{ minWidth: barPct > 0 ? 3 : 0, backgroundColor: '#05AB8C', opacity: 0.85 }} />
                    )}
                  </div>
                  <div className="w-px h-4 bg-[#E0E0E0] mx-px flex-shrink-0" />
                  <div className="w-[44%]">
                    {isPos && (
                      <motion.div initial={{ width: 0 }} animate={{ width: `${barPct}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                        className="h-2.5 rounded-r-sm"
                        style={{ minWidth: barPct > 0 ? 3 : 0, backgroundColor: '#E5376B', opacity: 0.85 }} />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex gap-4 text-[10px] border-t border-[#F0F0F0] pt-2">
          <span className="flex items-center gap-1.5"><span className="h-2 w-5 rounded-sm bg-[#05AB8C] opacity-80 inline-block" />Reduces risk</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-5 rounded-sm bg-[#E5376B] opacity-80 inline-block" />Increases risk</span>
        </div>
      </div>

      {/* Summary alert */}
      <Alert variant="info">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs leading-relaxed">
          {buildSummary(tx, positiveFeatures.map(([k]) => FEATURE_LABELS[k] || k), corridorNegative)}
        </AlertDescription>
      </Alert>

      {/* Explainer collapsible */}
      <Collapsible open={explainerOpen} onOpenChange={setExplainerOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-[#828282] border border-[#E0E0E0] bg-white">
            How is this score calculated?
            <ChevronDown size={13} className={`transition-transform duration-200 ${explainerOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="rounded-b border border-t-0 border-[#E0E0E0] bg-white px-4 py-3 text-xs text-[#4F4F4F] leading-relaxed space-y-1.5">
            <p>The score measures deviation across 6 behavioral dimensions relative to the customer's 90-day baseline and peer group. Positive values increase the score; negative values reduce it.</p>
            <p>Values are normalized to 0–100 anchored at 50 (baseline behavior). Scores above 70 are flagged for review; above 85 are high-confidence alerts.</p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* SAR CTA */}
      {tx.ml_score > 70 && (
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={() => router.push(`/sar/${tx.id}`)}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-4 font-bold text-base"
          style={{ backgroundColor: '#F5A800', color: '#011E41' }}>
          <ArrowUpRight size={16} />
          Generate SAR Draft
        </motion.button>
      )}
    </div>
  )
}

function buildSummary(tx: Transaction, topPos: string[], corridorNeg: boolean) {
  let t = `This transaction received a score of ${tx.ml_score} out of 100.`
  if (topPos.length > 0) t += ` The primary risk drivers were ${topPos.join(' and ')}.`
  if (corridorNeg) t += ` The counterparty jurisdiction is consistent with this customer's historical activity, which reduced the score.`
  if (tx.rule_fired && !tx.is_true_positive) t += ` A static rule was triggered, but behavioral analysis suggests this is likely a false positive.`
  return t
}
