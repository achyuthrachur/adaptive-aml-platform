'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, useInView, animate, useMotionValue, useTransform } from 'framer-motion'
import {
  ArrowRight, ShieldAlert, GitBranch, Brain,
  CheckCircle, Database, Cpu, BarChart3,
  AlertTriangle, Network, FileSearch, Zap,
  ChevronRight, Play,
} from 'lucide-react'

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ to, prefix = '', suffix = '', duration = 2.2 }: { to: number; prefix?: string; suffix?: string; duration?: number }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => `${prefix}${Math.round(v).toLocaleString()}${suffix}`)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const ctrl = animate(count, to, { duration, ease: [0.16, 1, 0.3, 1] })
    return ctrl.stop
  }, [inView, to, duration, count])

  return <motion.span ref={ref}>{rounded}</motion.span>
}

// ── Floating badge ─────────────────────────────────────────────────────────────
function FloatingBadge({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4, type: 'spring', stiffness: 200 }}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur-sm"
    >
      {children}
    </motion.span>
  )
}

const FEATURES = [
  {
    icon: ShieldAlert,
    color: '#F5A800',
    title: 'Behavioral Intelligence',
    body: 'Establish 90-day baselines per customer. Score every transaction against peer group norms — not just dollar thresholds. Catch structuring, velocity anomalies, and pattern drift that rules never see.',
  },
  {
    icon: Network,
    color: '#05AB8C',
    title: 'Graph Risk Networks',
    body: 'Map the full transaction network. Surface layering chains, hub counterparties, and 1-hop sanctioned adjacency. Relationship-level risk is invisible to threshold systems — visible here instantly.',
  },
  {
    icon: Brain,
    color: '#0075C9',
    title: 'Explainable AI Scoring',
    body: 'Every score includes a SHAP feature breakdown — which behaviors drove the risk, by how much, and in which direction. Satisfies FinCEN explainability requirements out of the box.',
  },
  {
    icon: FileSearch,
    color: '#B14FC5',
    title: 'AI SAR Drafting',
    body: 'Generate FinCEN-compliant SAR narratives in seconds using GPT-5. Third-person, past tense, no placeholder fields. BSA officers review and sign — not start from scratch.',
  },
]

const PIPELINE = [
  { step: '01', icon: Database, label: 'Ingest', sub: 'CSV, Core Banking, SWIFT' },
  { step: '02', icon: Cpu, label: 'Baseline', sub: '90-day behavioral model' },
  { step: '03', icon: BarChart3, label: 'Score', sub: '6-feature ML attribution' },
  { step: '04', icon: Network, label: 'Map', sub: 'Relationship graph analysis' },
  { step: '05', icon: Zap, label: 'Alert', sub: 'Explainable, ranked, actionable' },
]

const STATS = [
  { value: 61, suffix: '%', label: 'Avg false positive rate in rules-only programs', color: '#F5A800' },
  { value: 73, suffix: '', label: 'Transactions the model catches that rules miss (demo)', color: '#05AB8C' },
  { value: 3, suffix: '', label: 'Network risk patterns invisible to threshold systems', color: '#0075C9' },
  { value: 94, suffix: '%', label: 'Time saved drafting SAR narratives with AI assist', color: '#B14FC5' },
]

export default function LandingPage() {
  const router = useRouter()
  const [videoPlaying, setVideoPlaying] = useState(false)

  return (
    <div style={{ backgroundColor: '#050E1A', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* ── Navbar ─────────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 backdrop-blur-md"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(5,14,26,0.85)' }}
      >
        <Image src="/crowe-logo-white.svg" alt="Crowe" width={96} height={26} className="h-6 w-auto" />
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/40 hidden md:block">Adaptive AML Intelligence Platform</span>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/connect')}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
            style={{ backgroundColor: '#F5A800', color: '#011E41' }}
          >
            Launch Demo <ArrowRight size={14} />
          </motion.button>
        </div>
      </motion.nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center overflow-hidden">
        {/* Animated background radial */}
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.05, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
              width: 800, height: 500,
              background: 'radial-gradient(ellipse at center, rgba(0,117,201,0.18) 0%, rgba(5,14,26,0) 70%)',
              filter: 'blur(40px)',
            }}
          />
          <motion.div
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            style={{
              position: 'absolute', bottom: '5%', right: '15%',
              width: 400, height: 300,
              background: 'radial-gradient(ellipse at center, rgba(245,168,0,0.12) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
          {/* Dot grid */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 flex justify-center gap-3 flex-wrap"
          >
            <FloatingBadge delay={0.2}><CheckCircle size={11} className="text-[#05AB8C]" /> FinCEN-aligned explainability</FloatingBadge>
            <FloatingBadge delay={0.3}><CheckCircle size={11} className="text-[#05AB8C]" /> GPT-5 SAR drafting</FloatingBadge>
            <FloatingBadge delay={0.4}><CheckCircle size={11} className="text-[#05AB8C]" /> Graph network analysis</FloatingBadge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-6 font-bold leading-tight text-white"
            style={{ fontSize: 'clamp(36px, 5vw, 64px)', letterSpacing: '-0.03em' }}
          >
            AML compliance that sees<br />
            <span style={{
              background: 'linear-gradient(135deg, #F5A800 0%, #FFD231 50%, #F5A800 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              what rules never will
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mx-auto mb-10 max-w-2xl leading-relaxed"
            style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)' }}
          >
            Behavioral baselines, graph network intelligence, and explainable ML scores —
            engineered for financial institutions that need to reduce false positives without missing real risk.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(245,168,0,0.35)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/connect')}
              className="flex items-center gap-2.5 rounded-xl px-8 py-4 font-bold text-base"
              style={{ backgroundColor: '#F5A800', color: '#011E41' }}
            >
              <Play size={16} fill="#011E41" />
              Start Live Demo
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/overview')}
              className="flex items-center gap-2 rounded-xl px-8 py-4 font-semibold text-base"
              style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.04)' }}
            >
              View Dashboard <ChevronRight size={16} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ── Stats row ──────────────────────────────────────────── */}
      <section className="px-8 py-16">
        <div className="mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl p-6 text-center"
              style={{ border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              <div className="tabular-nums font-bold mb-2 leading-none" style={{ fontSize: 44, color: s.color }}>
                <Counter to={s.value} suffix={s.suffix} />
              </div>
              <div className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Problem statement ──────────────────────────────────── */}
      <section className="px-8 py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: '#F5A800' }}>
              The Problem
            </div>
            <h2 className="font-bold text-white mb-4" style={{ fontSize: 'clamp(28px, 3vw, 42px)', letterSpacing: '-0.02em' }}>
              Rules-based AML is breaking compliance teams
            </h2>
            <p className="mx-auto max-w-2xl text-base" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Static thresholds fire on the wrong transactions, miss relationship-level risk entirely,
              and leave analysts with no explanation to give regulators.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: AlertTriangle, color: '#F5A800',
                stat: '~60%', statLabel: 'of rule alerts are false positives',
                title: 'Too much noise',
                body: 'Analysts spend the majority of their time reviewing legitimate transactions. Threshold rules fire on amount and jurisdiction — not behavior. The result: alert fatigue, missed investigations, and burned-out teams.',
              },
              {
                icon: Network, color: '#E5376B',
                stat: '0%', statLabel: 'of layering chains visible to rules',
                title: 'Invisible relationship risk',
                body: 'Money laundering happens across accounts, entities, and jurisdictions. Static rules see single transactions. Graph analysis sees the chain — from Customer A through three shell companies to Customer B.',
              },
              {
                icon: FileSearch, color: '#0075C9',
                stat: '4–8h', statLabel: 'avg time to draft one SAR narrative',
                title: 'Unexplainable decisions',
                body: 'Regulators require documented reasoning. "The amount was over $10,000" is not a SAR narrative. Every flag needs a behavioral explanation — and a compliance officer to sign off on it.',
              },
            ].map((card, i) => {
              const Icon = card.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  whileHover={{ y: -4 }}
                  className="rounded-2xl p-7"
                  style={{ border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: card.color + '20' }}>
                      <Icon size={18} style={{ color: card.color }} />
                    </div>
                    <div>
                      <div className="text-xl font-bold tabular-nums" style={{ color: card.color }}>{card.stat}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{card.statLabel}</div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-white mb-2" style={{ fontSize: 16 }}>{card.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{card.body}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section className="px-8 py-20" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: '#05AB8C' }}>
              The Platform
            </div>
            <h2 className="font-bold text-white" style={{ fontSize: 'clamp(28px, 3vw, 42px)', letterSpacing: '-0.02em' }}>
              Four capabilities. One platform.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -3, borderColor: f.color + '40' }}
                  className="rounded-2xl p-7 transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.025)' }}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: f.color + '18' }}>
                    <Icon size={22} style={{ color: f.color }} />
                  </div>
                  <h3 className="mb-2 font-semibold text-white" style={{ fontSize: 17 }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{f.body}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Data pipeline ──────────────────────────────────────── */}
      <section className="px-8 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: '#0075C9' }}>
              How It Works
            </div>
            <h2 className="font-bold text-white" style={{ fontSize: 'clamp(28px, 3vw, 42px)', letterSpacing: '-0.02em' }}>
              From raw transactions to risk intelligence
            </h2>
            <p className="mt-4 text-base" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Five automated steps between your data and actionable compliance insights.
            </p>
          </motion.div>

          <div className="flex items-center gap-0 overflow-x-auto pb-4">
            {PIPELINE.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={i} className="flex items-center flex-1 min-w-[160px]">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="flex-1 flex flex-col items-center text-center p-5 rounded-2xl"
                    style={{ border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.03)' }}
                  >
                    <div className="text-xs font-bold mb-3 tabular-nums" style={{ color: 'rgba(255,255,255,0.2)' }}>{step.step}</div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-3" style={{ backgroundColor: 'rgba(0,117,201,0.15)' }}>
                      <Icon size={20} style={{ color: '#0075C9' }} />
                    </div>
                    <div className="font-semibold text-white mb-1" style={{ fontSize: 14 }}>{step.label}</div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{step.sub}</div>
                  </motion.div>
                  {i < PIPELINE.length - 1 && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.1 + 0.3 }}
                      className="mx-1 flex-shrink-0"
                      style={{ width: 24, height: 1, backgroundColor: 'rgba(255,255,255,0.12)', transformOrigin: 'left' }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="px-8 py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl rounded-3xl p-14 text-center relative overflow-hidden"
          style={{ border: '1px solid rgba(245,168,0,0.2)', backgroundColor: 'rgba(245,168,0,0.04)' }}
        >
          <div className="pointer-events-none absolute inset-0" style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(245,168,0,0.1) 0%, transparent 60%)',
          }} />
          <h2 className="relative font-bold text-white mb-4" style={{ fontSize: 'clamp(26px, 3vw, 38px)', letterSpacing: '-0.02em' }}>
            See it working on real transaction patterns
          </h2>
          <p className="relative mb-10 text-base" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Connect a demo dataset and walk through the full ingestion, scoring, network analysis,
            and SAR drafting workflow in under 5 minutes.
          </p>
          <div className="relative flex items-center justify-center gap-4 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 50px rgba(245,168,0,0.4)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/connect')}
              className="flex items-center gap-2.5 rounded-xl px-8 py-4 font-bold text-base"
              style={{ backgroundColor: '#F5A800', color: '#011E41' }}
            >
              <Play size={16} fill="#011E41" />
              Start Demo
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/overview')}
              className="flex items-center gap-2 rounded-xl px-8 py-4 font-semibold text-base"
              style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}
            >
              Skip to Dashboard <ChevronRight size={16} />
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="px-8 py-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="mx-auto max-w-6xl flex items-center justify-between flex-wrap gap-4">
          <Image src="/crowe-logo-white.svg" alt="Crowe" width={80} height={22} className="h-5 w-auto opacity-40" />
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Adaptive AML Intelligence Platform · All data is synthetic · Demo build · © 2026 Crowe LLP
          </p>
        </div>
      </footer>
    </div>
  )
}
