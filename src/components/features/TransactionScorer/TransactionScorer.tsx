'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { MousePointerClick, ChevronLeft, ChevronRight, ChevronDown, Info } from 'lucide-react'
import type { Transaction } from '@/types/transaction'
import type { Customer } from '@/types/customer'
import { formatCurrency, formatDate, getRiskColor, FEATURE_LABELS, FEATURE_DESCRIPTIONS } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import RiskBadge from '@/components/ui/RiskBadge'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'

const SEGMENT_LABELS: Record<string, string> = {
  private_wealth: 'Private Wealth', corporate_treasury: 'Corp Treasury',
  correspondent_banking: 'Correspondent', retail: 'Retail',
}
const PAGE_SIZE = 20

interface Props {
  transactions: Transaction[]
  customerMap: Record<string, Customer>
}

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
    const customer = customerMap[tx.customer_id]
    if (segmentFilter !== 'all' && customer?.segment !== segmentFilter) return false
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
      if (tx) {
        setSelectedTx(tx)
        const idx = filtered.findIndex(t => t.id === selectedId)
        if (idx >= 0) setPage(Math.floor(idx / PAGE_SIZE))
      }
    }
  }, [selectedId, transactions]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    selectedRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedTx])

  const handleSelect = useCallback((tx: Transaction) => {
    setSelectedTx(tx)
    router.push(`/transactions?selected=${tx.id}`, { scroll: false })
  }, [router])

  return (
    <div className="flex gap-0 h-[calc(100vh-52px-48px)] min-h-0 -mx-6 -my-6">
      {/* Left panel */}
      <div className="w-[400px] min-w-[400px] flex flex-col border-r border-[#E0E0E0] bg-white px-4 pt-4 pb-2 overflow-hidden">
        {/* Filters */}
        <div className="space-y-2 pb-3 border-b border-[#F0F0F0] mb-3">
          <div className="flex gap-2">
            <Select value={segmentFilter} onValueChange={v => { setSegmentFilter(v); setPage(0) }}>
              <SelectTrigger className="flex-1 h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Segments</SelectItem>
                <SelectItem value="private_wealth">Private Wealth</SelectItem>
                <SelectItem value="corporate_treasury">Corp Treasury</SelectItem>
                <SelectItem value="correspondent_banking">Correspondent</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
              </SelectContent>
            </Select>
            <Select value={directionFilter} onValueChange={v => { setDirectionFilter(v); setPage(0) }}>
              <SelectTrigger className="flex-1 h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directions</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ruleFiredFilter} onValueChange={v => { setRuleFiredFilter(v); setPage(0) }}>
              <SelectTrigger className="flex-1 h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rules</SelectItem>
                <SelectItem value="yes">Rule Fired</SelectItem>
                <SelectItem value="no">No Rule</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#828282]">
            <span className="flex-shrink-0">Score {scoreMin}–{scoreMax}</span>
            <input type="range" min={0} max={100} value={scoreMin} onChange={e => setScoreMin(+e.target.value)} className="flex-1 accent-[#011E41] h-1" />
            <input type="range" min={0} max={100} value={scoreMax} onChange={e => setScoreMax(+e.target.value)} className="flex-1 accent-[#011E41] h-1" />
          </div>
          <div className="text-xs text-[#828282] tabular-nums">{filtered.length} transactions</div>
        </div>

        {/* Transaction list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b-2 border-[#E0E0E0]">
                {['Date', 'Customer', 'Amount', 'Rule', 'Score'].map(h => (
                  <th key={h} className="px-2 py-2 text-left text-[11px] font-semibold text-[#828282]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map(tx => {
                const isSelected = selectedTx?.id === tx.id
                const customer = customerMap[tx.customer_id]
                return (
                  <tr
                    key={tx.id}
                    ref={isSelected ? selectedRowRef : null}
                    onClick={() => handleSelect(tx)}
                    className="border-b border-[#F5F5F5] cursor-pointer transition-colors duration-75"
                    style={{
                      backgroundColor: isSelected ? 'rgba(245,168,0,0.1)' : 'white',
                      borderLeft: isSelected ? '3px solid #F5A800' : '3px solid transparent',
                    }}
                  >
                    <td className="px-2 py-1.5 whitespace-nowrap text-[#828282]">{tx.date}</td>
                    <td className="px-2 py-1.5 max-w-[80px] overflow-hidden text-ellipsis whitespace-nowrap font-medium text-[#011E41]">
                      {customer?.name?.split(' ')[0] || tx.customer_id}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap tabular-nums">{formatCurrency(tx.amount)}</td>
                    <td className="px-2 py-1.5">
                      {tx.rule_fired
                        ? <span className="bg-[#FEE2E2] text-[#DC2626] px-1.5 py-0.5 rounded text-[10px] font-medium">Fired</span>
                        : <span className="bg-[#F3F4F6] text-[#6B7280] px-1.5 py-0.5 rounded text-[10px]">—</span>}
                    </td>
                    <td className="px-2 py-1.5">
                      <span className="font-bold tabular-nums" style={{ color: getRiskColor(tx.ml_score) }}>{tx.ml_score}</span>
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
            <ChevronLeft size={16} />
          </Button>
          <span className="text-xs text-[#828282] tabular-nums">Page {page + 1} of {Math.max(1, totalPages)}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-y-auto bg-[#F8F9FB] p-6">
        <AnimatePresence mode="wait">
          {!selectedTx ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-[#BDBDBD] gap-3"
            >
              <MousePointerClick size={44} strokeWidth={1.2} />
              <div className="text-center">
                <p className="text-sm font-medium">Select a transaction</p>
                <p className="text-xs mt-1">to view its behavioral risk breakdown</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={selectedTx.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
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
  const features = Object.entries(tx.ml_features) as [keyof typeof tx.ml_features, number][]
  const sortedFeatures = [...features].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
  const maxMag = Math.max(...features.map(([, v]) => Math.abs(v)))
  const positiveFeatures = sortedFeatures.filter(([, v]) => v > 0).slice(0, 2)
  const corridorNegative = tx.ml_features.corridor_familiarity < 0

  return (
    <div className="max-w-[560px]">
      {/* Header */}
      <div className="rounded-lg border border-[#E0E0E0] bg-white p-5 mb-4 shadow-card">
        <div className="font-mono text-xs text-[#828282] mb-2">{tx.id}</div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {customer && (
            <>
              <span className="font-semibold text-[#011E41]">{customer.name}</span>
              <span className="bg-[#EEF2FF] text-[#4338CA] px-2 py-0.5 rounded text-xs font-medium">
                {SEGMENT_LABELS[customer.segment] || customer.segment}
              </span>
            </>
          )}
        </div>
        <div className="flex gap-4 text-xs text-[#828282] mb-4 flex-wrap">
          <span className="tabular-nums font-medium text-[#011E41]">{formatCurrency(tx.amount)}</span>
          <span style={{ color: tx.direction === 'outbound' ? '#E5376B' : '#05AB8C' }} className="capitalize font-medium">{tx.direction}</span>
          <span>{formatDate(tx.date)}</span>
        </div>
        <div className="flex items-end gap-4">
          <div>
            <div className="tabular-nums font-bold leading-none mb-1" style={{ fontSize: 56, color: riskColor }}>
              {tx.ml_score}
            </div>
            <div className="text-xs text-[#828282]">ML Risk Score · 0–100</div>
          </div>
          <div className="pb-1 flex flex-col gap-1.5">
            {tx.rule_fired && (
              <span className="bg-[#FEE2E2] text-[#DC2626] px-2.5 py-1 rounded text-xs font-medium">
                {tx.rule_label || 'Rule Fired'}
              </span>
            )}
            {!tx.rule_fired && tx.ml_score > 70 && (
              <span className="bg-[#D1F5EF] text-[#0C7876] px-2.5 py-1 rounded text-xs font-medium">
                Model-only detection
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SHAP bars */}
      <div className="rounded-lg border border-[#E0E0E0] bg-white p-5 mb-4 shadow-card">
        <h3 className="text-sm font-semibold text-[#011E41] mb-1">Why This Score — Feature Breakdown</h3>
        <div className="flex justify-between text-[10px] text-[#828282] mb-3 border-b border-[#F0F0F0] pb-2">
          <span>← Reduces risk</span>
          <span className="w-px bg-[#E0E0E0]" />
          <span>Increases risk →</span>
        </div>
        <div className="space-y-3">
          {sortedFeatures.map(([key, value]) => {
            const isPos = value >= 0
            const barPct = maxMag > 0 ? (Math.abs(value) / maxMag) * 44 : 0
            return (
              <div key={key}>
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-xs font-medium text-[#011E41]">{FEATURE_LABELS[key] || key}</span>
                </div>
                <div className="text-[10px] text-[#828282] mb-1.5 leading-snug">{FEATURE_DESCRIPTIONS[key]}</div>
                <div className="flex items-center gap-0">
                  <div className="w-[44%] flex justify-end items-center">
                    {!isPos && (
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${barPct}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="flex items-center justify-end gap-1"
                        style={{ minWidth: barPct > 0 ? 4 : 0 }}
                      >
                        <span className="text-[10px] font-semibold text-[#05AB8C] flex-shrink-0">{value}</span>
                        <div className="h-4 rounded-l-sm bg-[#05AB8C] opacity-80" style={{ width: `${barPct}%`, minWidth: 4 }} />
                      </motion.div>
                    )}
                  </div>
                  <div className="w-px h-5 bg-[#E0E0E0] mx-px flex-shrink-0" />
                  <div className="w-[44%] flex items-center">
                    {isPos && (
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${barPct}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="flex items-center gap-1"
                        style={{ minWidth: barPct > 0 ? 4 : 0 }}
                      >
                        <div className="h-4 rounded-r-sm bg-[#E5376B] opacity-80" style={{ width: `${barPct}%`, minWidth: 4 }} />
                        <span className="text-[10px] font-semibold text-[#E5376B] flex-shrink-0">+{value}</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex gap-3 text-[10px] text-[#828282] border-t border-[#F0F0F0] pt-2">
          <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-sm bg-[#05AB8C] opacity-70 inline-block" /> Reduces risk</span>
          <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-sm bg-[#E5376B] opacity-70 inline-block" /> Increases risk</span>
        </div>
      </div>

      {/* Plain-English summary */}
      <Alert variant="info" className="mb-4">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs leading-relaxed">
          {buildSummary(tx, positiveFeatures.map(([k]) => FEATURE_LABELS[k] || k), corridorNegative)}
        </AlertDescription>
      </Alert>

      {/* How calculated collapsible */}
      <Collapsible open={explainerOpen} onOpenChange={setExplainerOpen} className="mb-4">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-[#828282] border border-[#E0E0E0] bg-white hover:bg-[#F8F9FB]">
            How is this score calculated?
            <ChevronDown size={13} className={`transition-transform ${explainerOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="rounded-b-md border border-t-0 border-[#E0E0E0] bg-white px-4 py-3 text-xs text-[#4F4F4F] leading-relaxed space-y-2">
            <p>The score is computed by measuring how far this transaction deviates across 6 behavioral dimensions relative to the customer's 90-day baseline and their peer group of similar customers.</p>
            <p>Each dimension contributes a signed value (shown in the breakdown above). Positive values increase the score; negative values reduce it. The values are summed and normalized to a 0–100 scale anchored at 50 (baseline behavior).</p>
            <p>Scores above 70 are flagged for review. Scores above 85 are considered high-confidence alerts. The model was tuned on synthetic behavioral patterns representing four AML risk typologies.</p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* SAR button */}
      {tx.ml_score > 70 && (
        <Button variant="amber" className="w-full" onClick={() => router.push(`/sar/${tx.id}`)}>
          Generate SAR Draft →
        </Button>
      )}
    </div>
  )
}

function buildSummary(tx: Transaction, topPos: string[], corridorNeg: boolean) {
  let t = `This transaction received a score of ${tx.ml_score} out of 100.`
  if (topPos.length > 0) t += ` The primary risk drivers were ${topPos.join(' and ')}.`
  if (corridorNeg) t += ` The counterparty jurisdiction is consistent with this customer's historical activity, which reduced the score.`
  if (tx.rule_fired && !tx.is_true_positive) t += ` A static rule was triggered on this transaction, but behavioral analysis suggests this is likely a false positive.`
  return t
}
