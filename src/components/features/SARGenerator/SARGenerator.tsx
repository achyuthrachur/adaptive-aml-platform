'use client'

import { useState } from 'react'
import { Check, RefreshCw, AlertTriangle, FileText, Edit, UserCheck, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Transaction } from '@/types/transaction'
import type { Customer } from '@/types/customer'
import { formatCurrency, formatDate, getRiskColor, FEATURE_LABELS, FEATURE_DESCRIPTIONS } from '@/lib/utils'
import ExplainerBanner from '@/components/ui/ExplainerBanner'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

const SEGMENT_LABELS: Record<string, string> = {
  private_wealth: 'Private Wealth', corporate_treasury: 'Corporate Treasury',
  correspondent_banking: 'Correspondent Banking', retail: 'Retail',
}

const NEXT_STEPS = [
  { icon: FileText, title: 'Review for accuracy', body: 'Verify all facts, amounts, dates, and entities. The AI narrative is a starting point, not a final document.' },
  { icon: Edit, title: 'Edit as needed', body: 'Add institution-specific context, case numbers, or additional supporting details not captured in the transaction data.' },
  { icon: UserCheck, title: 'BSA Officer approval', body: 'Obtain signature from a qualified BSA/AML compliance officer before proceeding to filing.' },
  { icon: Send, title: 'File via FinCEN BSA E-Filing', body: 'Submit through the FinCEN BSA E-Filing System at bsaefiling.fincen.treas.gov. Retain a copy for five years.' },
]

interface Props { transaction: Transaction; customer: Customer }

export default function SARGenerator({ transaction, customer }: Props) {
  const [narrative, setNarrative] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const featureEntries = Object.entries(transaction.ml_features) as [keyof typeof transaction.ml_features, number][]
  featureEntries.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
  const topFeatures = featureEntries.slice(0, 3)
  const topFeatureStrings = topFeatures.map(([k, v]) => `${FEATURE_LABELS[k] || k}: ${v > 0 ? '+' : ''}${v}`)
  const riskColor = getRiskColor(transaction.ml_score)

  async function generateNarrative() {
    setLoading(true); setError(''); setNarrative('')
    try {
      const res = await fetch('/api/sar-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction, customer, topFeatures: topFeatureStrings }),
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setNarrative(data.narrative || '')
    } catch (err) {
      setError('Narrative generation failed. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(narrative)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-[820px] mx-auto pt-6">
      <ExplainerBanner
        title="SAR Draft Generator — AI-assisted, officer-reviewed"
        insight="This tool drafts a Suspicious Activity Report narrative using GPT-5, guided by the transaction's behavioral risk profile and FinCEN SAR best practices. The draft follows third-person past tense, avoids placeholder fields, and references the specific behavioral indicators that elevated the score. A qualified BSA officer must review and approve before submission."
        pillars={[
          { icon: FileText, title: 'GPT-5 Drafting', body: 'Narrative follows FinCEN SAR format: subject description, suspicious activity, behavioral evidence.', color: '#0075C9' },
          { icon: AlertTriangle, title: 'Officer Review Required', body: 'AI-generated narratives require human review. The tool accelerates drafting, not decision-making.', color: '#F5A800' },
        ]}
      />

      {/* Transaction header */}
      <Card className="mb-5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-xs text-[#828282] mb-1">{transaction.id}</div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-[#011E41] text-lg">{customer.name}</span>
                <span className="bg-[#EEF2FF] text-[#4338CA] px-2 py-0.5 rounded text-xs font-medium">
                  {SEGMENT_LABELS[customer.segment]}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="tabular-nums font-bold leading-none mb-0.5" style={{ fontSize: 42, color: riskColor }}>
                {transaction.ml_score}
              </div>
              <div className="text-xs text-[#828282]">Risk Score</div>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-3">
          <div className="flex gap-6 text-sm mb-4 flex-wrap">
            <div><span className="text-[#828282]">Amount</span><div className="font-semibold tabular-nums text-[#011E41]">{formatCurrency(transaction.amount)}</div></div>
            <div><span className="text-[#828282]">Direction</span><div className="font-semibold capitalize" style={{ color: transaction.direction === 'outbound' ? '#E5376B' : '#05AB8C' }}>{transaction.direction}</div></div>
            <div><span className="text-[#828282]">Date</span><div className="font-semibold text-[#011E41]">{formatDate(transaction.date)}</div></div>
            <div><span className="text-[#828282]">Counterparty</span><div className="font-semibold text-[#011E41]">{transaction.counterparty_jurisdiction}</div></div>
          </div>

          {/* Top feature chips */}
          <div>
            <div className="text-xs text-[#828282] mb-2 font-medium">Primary risk drivers</div>
            <TooltipProvider delayDuration={200}>
              <div className="flex flex-wrap gap-2">
                {topFeatures.map(([k, v]) => (
                  <Tooltip key={k}>
                    <TooltipTrigger asChild>
                      <span className="bg-[#FFF3CC] text-[#7A4F00] border border-[#F5A800]/30 px-3 py-1 rounded-full text-xs font-semibold cursor-help">
                        {FEATURE_LABELS[k]}: {v > 0 ? '+' : ''}{v}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent><p className="font-semibold mb-0.5">{FEATURE_LABELS[k]}</p><p className="text-slate-300">{FEATURE_DESCRIPTIONS[k]}</p></TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* Generate / Loading / Output */}
      <AnimatePresence mode="wait">
        {!narrative && !loading && !error && (
          <motion.div key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Button variant="amber" className="w-full h-11 text-base" onClick={generateNarrative}>
              Generate SAR Draft
            </Button>
          </motion.div>
        )}

        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="rounded-lg p-6" style={{ background: 'linear-gradient(135deg, #011E41 0%, #01152E 100%)' }}>
              <div className="text-xs text-white/50 mb-3 font-medium">Generating narrative…</div>
              <Skeleton className="h-4 w-full mb-2" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <Skeleton className="h-4 w-[92%] mb-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <Skeleton className="h-4 w-[85%] mb-2" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <Skeleton className="h-4 w-[90%] mb-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <Skeleton className="h-4 w-[78%]" style={{ background: 'rgba(255,255,255,0.04)' }} />
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Generation failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button variant="outline" onClick={generateNarrative}>Retry</Button>
          </motion.div>
        )}

        {narrative && (
          <motion.div key="output" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {/* Narrative */}
            <div className="rounded-lg p-6 mb-4" style={{ background: 'linear-gradient(135deg, #011E41 0%, #01152E 100%)' }}>
              <p className="text-white text-sm leading-[1.8] whitespace-pre-wrap">{narrative}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-4">
              <Button variant="outline" onClick={copyToClipboard} className="flex items-center gap-2">
                {copied ? <><Check size={14} className="text-[#05AB8C]" /> Copied!</> : 'Copy to Clipboard'}
              </Button>
              <Button variant="amber" onClick={generateNarrative} disabled={loading} className="flex items-center gap-2">
                <RefreshCw size={14} /> Regenerate
              </Button>
            </div>

            {/* Disclaimer */}
            <Alert variant="warning" className="mb-5">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Review required before submission</AlertTitle>
              <AlertDescription>
                This narrative is AI-generated by GPT-5 and requires review and approval by a qualified BSA/AML compliance officer before submission to FinCEN. Do not submit without human review.
              </AlertDescription>
            </Alert>

            {/* Next steps */}
            <Card>
              <CardHeader><CardTitle>What to do next</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {NEXT_STEPS.map((step, i) => {
                    const Icon = step.icon
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#F0F4F8] text-xs font-bold text-[#011E41]">
                          {i + 1}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[#011E41] flex items-center gap-1.5">
                            <Icon size={13} className="text-[#828282]" />{step.title}
                          </div>
                          <div className="text-xs text-[#828282] mt-0.5 leading-relaxed">{step.body}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
