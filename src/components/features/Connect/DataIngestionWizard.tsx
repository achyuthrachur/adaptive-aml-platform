'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Database, Zap, CheckCircle2, ArrowRight,
  FileText, Wifi, Server, AlertTriangle, ChevronLeft,
  ShieldCheck, BarChart3, Network, Cpu, Clock, Users,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────
type Source = 'csv' | 'api' | 'swift'
type Step = 1 | 2 | 3 | 4 | 5

// ── Demo data preview ─────────────────────────────────────────────────────────
const PREVIEW_ROWS = [
  { id: 'TXN-0000042', date: '2024-11-28', amount: '$284,500', direction: 'OUTBOUND', counterparty: 'Meridian Capital LLC', jurisdiction: 'Cayman Islands', type: 'WIRE' },
  { id: 'TXN-0000019', date: '2024-11-27', amount: '$12,400', direction: 'INBOUND', counterparty: 'R. Castellan', jurisdiction: 'United States', type: 'ACH' },
  { id: 'TXN-0000087', date: '2024-11-27', amount: '$1,920,000', direction: 'OUTBOUND', counterparty: 'Apex Global Holdings', jurisdiction: 'British Virgin Islands', type: 'WIRE' },
  { id: 'TXN-0000031', date: '2024-11-26', amount: '$8,750', direction: 'INBOUND', counterparty: 'T. Voss', jurisdiction: 'Germany', type: 'WIRE' },
  { id: 'TXN-0000063', date: '2024-11-25', amount: '$445,200', direction: 'OUTBOUND', counterparty: 'Harlow Trade Partners', jurisdiction: 'Panama', type: 'FX' },
  { id: 'TXN-0000091', date: '2024-11-24', amount: '$33,100', direction: 'INBOUND', counterparty: 'Crestwood Investments', jurisdiction: 'Singapore', type: 'ACH' },
]

const FIELD_MAPPINGS = [
  { source: 'transaction_id', target: 'id', status: 'mapped' },
  { source: 'value_date', target: 'date', status: 'mapped' },
  { source: 'debit_credit_indicator', target: 'direction', status: 'mapped' },
  { source: 'transaction_amount_usd', target: 'amount', status: 'mapped' },
  { source: 'beneficiary_name', target: 'counterparty_name', status: 'mapped' },
  { source: 'beneficiary_country', target: 'counterparty_jurisdiction', status: 'mapped' },
  { source: 'payment_type_code', target: 'transaction_type', status: 'mapped' },
  { source: 'narrative_text', target: '— unmapped —', status: 'skipped' },
]

const ANALYSIS_STEPS = [
  { label: 'Parsing transaction records', sub: '1,247 transactions processed', icon: FileText, duration: 900 },
  { label: 'Validating schema and field types', sub: '7 of 8 fields mapped successfully', icon: ShieldCheck, duration: 700 },
  { label: 'Running compliance pre-checks', sub: 'OFAC jurisdiction scan complete', icon: AlertTriangle, duration: 1100 },
  { label: 'Building behavioral baselines', sub: '50 customer profiles established', icon: Users, duration: 1400 },
  { label: 'Computing ML risk scores', sub: '6-feature attribution per transaction', icon: Cpu, duration: 1600 },
  { label: 'Mapping transaction network', sub: '3 risk patterns identified', icon: Network, duration: 1200 },
  { label: 'Generating alert queue', sub: '226 alerts ranked by severity', icon: BarChart3, duration: 800 },
]

// ── Step indicator ────────────────────────────────────────────────────────────
function StepDot({ n, current }: { n: number; current: number }) {
  const done = n < current
  const active = n === current
  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.div
        animate={{
          backgroundColor: done ? '#05AB8C' : active ? '#F5A800' : 'rgba(255,255,255,0.08)',
          borderColor: done ? '#05AB8C' : active ? '#F5A800' : 'rgba(255,255,255,0.15)',
          scale: active ? 1.15 : 1,
        }}
        transition={{ duration: 0.3 }}
        className="h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold"
        style={{ color: done || active ? '#050E1A' : 'rgba(255,255,255,0.3)' }}
      >
        {done ? <CheckCircle2 size={14} /> : n}
      </motion.div>
    </div>
  )
}

// ── Main wizard ───────────────────────────────────────────────────────────────
export default function DataIngestionWizard() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [source, setSource] = useState<Source>('csv')
  const [uploading, setUploading] = useState(false)
  const [uploadDone, setUploadDone] = useState(false)
  const [analysisStep, setAnalysisStep] = useState(-1)
  const [analysisComplete, setAnalysisComplete] = useState(false)

  // Simulate upload
  function handleUpload() {
    setUploading(true)
    setTimeout(() => { setUploading(false); setUploadDone(true) }, 2200)
  }

  // Simulate analysis steps
  useEffect(() => {
    if (step !== 4) return
    setAnalysisStep(0)
    let i = 0
    const delays = ANALYSIS_STEPS.reduce<number[]>((acc, s, idx) => {
      acc.push((acc[idx - 1] || 0) + s.duration)
      return acc
    }, [])
    const timers = delays.map((d, idx) =>
      setTimeout(() => {
        setAnalysisStep(idx + 1)
        if (idx === ANALYSIS_STEPS.length - 1) setTimeout(() => setAnalysisComplete(true), 600)
      }, d)
    )
    return () => timers.forEach(clearTimeout)
  }, [step])

  const card = 'rounded-2xl p-8'
  const cardStyle = { border: '1px solid rgba(255,255,255,0.09)', backgroundColor: 'rgba(255,255,255,0.04)' }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050E1A' }}>
      {/* Nav */}
      <div className="flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-white/40 hover:text-white/70 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <Image src="/crowe-logo-white.svg" alt="Crowe" width={80} height={22} className="h-5 w-auto opacity-70" />
          <span className="text-sm text-white/30">/ Connect Data Source</span>
        </div>
        <button onClick={() => router.push('/overview')}
          className="text-xs text-white/30 hover:text-white/60 transition-colors">
          Skip to dashboard →
        </button>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-3 py-8 px-8">
        {[1, 2, 3, 4, 5].map(n => (
          <div key={n} className="flex items-center gap-3">
            <StepDot n={n} current={step} />
            {n < 5 && (
              <motion.div
                animate={{ backgroundColor: n < step ? '#05AB8C' : 'rgba(255,255,255,0.08)' }}
                transition={{ duration: 0.4 }}
                style={{ width: 48, height: 1 }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-3xl px-6 pb-16">
        <AnimatePresence mode="wait">

          {/* ── Step 1: Choose source ───────────────────────────── */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
              <h2 className="text-2xl font-bold text-white mb-2">Choose your data source</h2>
              <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Connect to your transaction data. Demo mode loads a pre-built synthetic dataset.
              </p>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {([
                  { id: 'csv' as Source, icon: Upload, label: 'Transaction Files', sub: 'CSV, XLSX, fixed-width' },
                  { id: 'api' as Source, icon: Wifi, label: 'Core Banking API', sub: 'Temenos, FIS, Jack Henry' },
                  { id: 'swift' as Source, icon: Server, label: 'SWIFT Feed', sub: 'MT940, MT103, MX' },
                ] as { id: Source; icon: typeof Upload; label: string; sub: string }[]).map(opt => {
                  const Icon = opt.icon
                  const active = source === opt.id
                  return (
                    <motion.button
                      key={opt.id}
                      onClick={() => setSource(opt.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`${card} text-left transition-colors`}
                      style={{
                        ...cardStyle,
                        borderColor: active ? '#F5A800' : 'rgba(255,255,255,0.09)',
                        backgroundColor: active ? 'rgba(245,168,0,0.08)' : 'rgba(255,255,255,0.04)',
                      }}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl mb-4"
                        style={{ backgroundColor: active ? 'rgba(245,168,0,0.2)' : 'rgba(255,255,255,0.06)' }}>
                        <Icon size={18} style={{ color: active ? '#F5A800' : 'rgba(255,255,255,0.5)' }} />
                      </div>
                      <div className="font-semibold text-white mb-1" style={{ fontSize: 14 }}>{opt.label}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{opt.sub}</div>
                      {active && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium" style={{ color: '#F5A800' }}>
                          <CheckCircle2 size={12} /> Selected
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>

              <div className={`${card} mb-8`} style={{ ...cardStyle, borderColor: 'rgba(0,117,201,0.3)', backgroundColor: 'rgba(0,117,201,0.05)' }}>
                <div className="flex items-start gap-3">
                  <Database size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#0075C9' }} />
                  <div>
                    <div className="font-semibold text-white text-sm mb-1">Demo mode</div>
                    <div className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      We&apos;ll load a pre-built synthetic dataset of 1,247 transactions across 50 customers spanning 90 days. All data is fictional and designed to showcase layering patterns, hub counterparties, and sanctioned adjacency.
                    </div>
                  </div>
                </div>
              </div>

              <NextButton onClick={() => setStep(2)} label="Continue" />
            </motion.div>
          )}

          {/* ── Step 2: Upload ──────────────────────────────────── */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
              <h2 className="text-2xl font-bold text-white mb-2">Load transaction data</h2>
              <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>Upload your file or use the demo dataset to continue.</p>

              {!uploadDone ? (
                <motion.div
                  onClick={handleUpload}
                  whileHover={{ borderColor: 'rgba(245,168,0,0.5)', backgroundColor: 'rgba(245,168,0,0.04)' }}
                  className="rounded-2xl border-2 border-dashed p-16 text-center cursor-pointer mb-8 transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.12)' }}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="h-12 w-12 rounded-full border-2 border-t-transparent"
                        style={{ borderColor: '#F5A800', borderTopColor: 'transparent' }}
                      />
                      <div className="text-white font-medium">Loading demo dataset…</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Parsing transactions_q4_2024.csv</div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                        <Upload size={24} style={{ color: 'rgba(255,255,255,0.5)' }} />
                      </div>
                      <div className="font-semibold text-white">Drop your file here, or click to browse</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>CSV, XLSX, TXT · max 50MB</div>
                      <div className="mt-2 rounded-lg px-4 py-2 text-xs font-medium" style={{ backgroundColor: 'rgba(245,168,0,0.15)', color: '#F5A800' }}>
                        Or click to load demo dataset →
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`${card} mb-8`}
                  style={{ ...cardStyle, borderColor: 'rgba(5,171,140,0.4)', backgroundColor: 'rgba(5,171,140,0.06)' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(5,171,140,0.15)' }}>
                      <FileText size={20} style={{ color: '#05AB8C' }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white mb-0.5">transactions_q4_2024.csv</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>1,247 records · 8 columns · 2.3 MB</div>
                    </div>
                    <CheckCircle2 size={20} style={{ color: '#05AB8C' }} />
                  </div>
                </motion.div>
              )}

              <div className="flex gap-3">
                <BackButton onClick={() => setStep(1)} />
                <NextButton onClick={() => setStep(3)} label="Preview Data" disabled={!uploadDone} />
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Preview & mapping ───────────────────────── */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
              <h2 className="text-2xl font-bold text-white mb-2">Data preview & field mapping</h2>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>Review detected fields. Mappings are pre-configured for the demo dataset.</p>

              {/* Preview table */}
              <div className="rounded-xl overflow-hidden mb-6" style={{ border: '1px solid rgba(255,255,255,0.09)' }}>
                <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
                  Showing 6 of 1,247 records
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        {['ID', 'Date', 'Amount', 'Dir', 'Counterparty', 'Jurisdiction', 'Type'].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PREVIEW_ROWS.map((r, i) => (
                        <motion.tr key={r.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                          className="hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-3 py-2.5 font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{r.id}</td>
                          <td className="px-3 py-2.5 text-white/70">{r.date}</td>
                          <td className="px-3 py-2.5 font-semibold text-white tabular-nums">{r.amount}</td>
                          <td className="px-3 py-2.5">
                            <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                              style={{ backgroundColor: r.direction === 'OUTBOUND' ? 'rgba(229,55,107,0.15)' : 'rgba(5,171,140,0.15)', color: r.direction === 'OUTBOUND' ? '#E5376B' : '#05AB8C' }}>
                              {r.direction}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-white/70 max-w-[120px] truncate">{r.counterparty}</td>
                          <td className="px-3 py-2.5 text-white/60">{r.jurisdiction}</td>
                          <td className="px-3 py-2.5 text-white/50">{r.type}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Field mappings */}
              <div className="rounded-xl overflow-hidden mb-6" style={{ border: '1px solid rgba(255,255,255,0.09)' }}>
                <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
                  Field Mapping — 7/8 fields mapped
                </div>
                <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {FIELD_MAPPINGS.map((m, i) => (
                    <motion.div key={m.source} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 px-4 py-3 text-xs">
                      <span className="font-mono flex-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{m.source}</span>
                      <ArrowRight size={12} style={{ color: 'rgba(255,255,255,0.2)' }} />
                      <span className="flex-1 font-medium" style={{ color: m.status === 'mapped' ? 'white' : 'rgba(255,255,255,0.3)' }}>{m.target}</span>
                      <span className="rounded-full px-2 py-0.5 font-semibold text-[10px]"
                        style={{
                          backgroundColor: m.status === 'mapped' ? 'rgba(5,171,140,0.15)' : 'rgba(255,255,255,0.06)',
                          color: m.status === 'mapped' ? '#05AB8C' : 'rgba(255,255,255,0.3)',
                        }}>
                        {m.status}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <BackButton onClick={() => setStep(2)} />
                <NextButton onClick={() => setStep(4)} label="Run Analysis" />
              </div>
            </motion.div>
          )}

          {/* ── Step 4: Analysis ────────────────────────────────── */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
              <h2 className="text-2xl font-bold text-white mb-2">Running AML analysis</h2>
              <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Building behavioral baselines, computing risk scores, and mapping the transaction network.
              </p>

              <div className={`${card} mb-8 space-y-4`} style={cardStyle}>
                {ANALYSIS_STEPS.map((s, i) => {
                  const Icon = s.icon
                  const done = analysisStep > i
                  const active = analysisStep === i
                  return (
                    <motion.div key={i} className="flex items-center gap-4"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: i <= analysisStep ? 1 : 0.3, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}>
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: done ? 'rgba(5,171,140,0.15)' : active ? 'rgba(245,168,0,0.15)' : 'rgba(255,255,255,0.05)' }}>
                        {done ? (
                          <CheckCircle2 size={16} style={{ color: '#05AB8C' }} />
                        ) : active ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                            <Icon size={16} style={{ color: '#F5A800' }} />
                          </motion.div>
                        ) : (
                          <Icon size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium" style={{ color: done ? 'rgba(255,255,255,0.9)' : active ? 'white' : 'rgba(255,255,255,0.4)' }}>
                          {s.label}
                        </div>
                        {(done || active) && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs mt-0.5"
                            style={{ color: done ? 'rgba(5,171,140,0.8)' : 'rgba(245,168,0,0.7)' }}>
                            {s.sub}
                          </motion.div>
                        )}
                      </div>
                      {active && (
                        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          <Clock size={11} className="inline mr-1" />running
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>

              {/* Progress bar */}
              <div className="mb-8">
                <div className="flex justify-between text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <span>Analysis progress</span>
                  <span className="tabular-nums">{Math.round((Math.min(analysisStep, ANALYSIS_STEPS.length) / ANALYSIS_STEPS.length) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #05AB8C, #F5A800)' }}
                    animate={{ width: `${(Math.min(analysisStep, ANALYSIS_STEPS.length) / ANALYSIS_STEPS.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {analysisComplete && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <NextButton onClick={() => setStep(5)} label="View Results" />
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── Step 5: Complete ────────────────────────────────── */}
          {step === 5 && (
            <motion.div key="s5" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div className="text-center mb-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
                  style={{ backgroundColor: 'rgba(5,171,140,0.15)', border: '2px solid rgba(5,171,140,0.4)' }}
                >
                  <CheckCircle2 size={36} style={{ color: '#05AB8C' }} />
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-3">Analysis complete</h2>
                <p className="text-base" style={{ color: 'rgba(255,255,255,0.5)' }}>Your dataset has been processed. Here&apos;s what the platform found.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { value: '1,247', label: 'Transactions ingested', color: '#0075C9', icon: Database },
                  { value: '50', label: 'Customer profiles built', color: '#F5A800', icon: Users },
                  { value: '226', label: 'Behavioral alerts generated', color: '#E5376B', icon: Zap },
                  { value: '3', label: 'Network risk patterns found', color: '#05AB8C', icon: Network },
                ].map((s, i) => {
                  const Icon = s.icon
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }} className={card}
                      style={cardStyle}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{ backgroundColor: s.color + '18' }}>
                          <Icon size={15} style={{ color: s.color }} />
                        </div>
                      </div>
                      <div className="tabular-nums font-bold text-white mb-1" style={{ fontSize: 28 }}>{s.value}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.label}</div>
                    </motion.div>
                  )
                })}
              </div>

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 50px rgba(245,168,0,0.4)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/overview')}
                className="w-full flex items-center justify-center gap-3 rounded-2xl py-5 text-base font-bold"
                style={{ backgroundColor: '#F5A800', color: '#011E41' }}
              >
                Enter the Dashboard
                <ArrowRight size={18} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function NextButton({ onClick, label, disabled }: { onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={disabled}
      className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-sm transition-opacity"
      style={{
        backgroundColor: disabled ? 'rgba(245,168,0,0.3)' : '#F5A800',
        color: disabled ? 'rgba(1,30,65,0.5)' : '#011E41',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {label} <ArrowRight size={15} />
    </motion.button>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl px-5 py-3.5 font-semibold text-sm"
      style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}
    >
      <ChevronLeft size={15} /> Back
    </motion.button>
  )
}
