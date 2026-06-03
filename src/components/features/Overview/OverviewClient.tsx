'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Eye, Cpu, GitBranch } from 'lucide-react'
import ExplainerBanner from '@/components/ui/ExplainerBanner'
import MetricCard from '@/components/ui/MetricCard'
import OverviewCharts from './OverviewCharts'

interface Props {
  rulesAlerts: number
  falsePosCount: number
  modelOnlyCount: number
  highRiskClusters: number
  ruleCaughtPct: number
  weekBuckets: { week: string; rule_only: number; confirmed: number; model_only: number }[]
  histogramData: { range: string; count: number }[]
  modelOnlyTotal: number
}

export default function OverviewClient({
  rulesAlerts, falsePosCount, modelOnlyCount, highRiskClusters,
  ruleCaughtPct, weekBuckets, histogramData, modelOnlyTotal,
}: Props) {
  const fpRate = rulesAlerts > 0 ? Math.round((falsePosCount / rulesAlerts) * 100) : 0

  return (
    <div>
      <ExplainerBanner
        title="Why static AML rules fail — and what behavioral AI sees instead"
        insight="This dashboard surfaces three systemic gaps in rules-based transaction monitoring. Static thresholds fire on the wrong transactions, miss relationship-level risk entirely, and can't explain their decisions to regulators."
        pillars={[
          {
            icon: AlertTriangle,
            title: `${fpRate}% False Positive Rate`,
            body: 'Most rule-triggered alerts are noise. Compliance teams spend hours reviewing transactions the model rates as low risk.',
            color: '#F5A800',
          },
          {
            icon: Eye,
            title: `${modelOnlyCount} Invisible Risks`,
            body: 'High-risk transactions the model detected — with no rule ever firing. These would have been missed entirely.',
            color: '#E5376B',
          },
          {
            icon: Cpu,
            title: 'Every Score Explained',
            body: 'Each ML score includes a feature breakdown showing exactly which behaviors drove the risk — satisfying FinCEN explainability requirements.',
            color: '#05AB8C',
          },
        ]}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-6 stagger-children">
        <MetricCard
          label="Rules Alerts (30d)"
          value={String(rulesAlerts)}
          sublabel="transactions triggered a rule"
        />
        <MetricCard
          label="Estimated False Positives"
          value={String(falsePosCount)}
          sublabel={`${fpRate}% of all rule alerts`}
          valueColor="#E5376B"
        />
        <MetricCard
          label="Model-Only Detections"
          value={String(modelOnlyCount)}
          sublabel="high risk — no rule fired"
          valueColor="#05AB8C"
        />
        <MetricCard
          label="High-Risk Network Clusters"
          value={String(highRiskClusters)}
          sublabel="layering · hub · sanctioned-adjacent"
          valueColor="#F5A800"
        />
      </div>

      {/* Charts */}
      <OverviewCharts
        weekBuckets={weekBuckets}
        histogramData={histogramData}
        modelOnlyAnnotation={modelOnlyTotal}
        ruleCaughtPct={ruleCaughtPct}
      />

      {/* How the model works */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-[#011E41] mb-3 tracking-tight">How the Behavioral Model Works</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              step: '01',
              title: 'Establish Baseline',
              body: 'For each customer, the model learns their normal behavior — typical transaction amounts, common counterparty jurisdictions, and transaction type mix — over a 90-day rolling window.',
              color: '#0075C9',
            },
            {
              step: '02',
              title: 'Score Deviation',
              body: 'Each new transaction is scored 0–100 based on how far it deviates across 6 behavioral dimensions: amount vs baseline, corridor familiarity, peer group comparison, counterparty risk, velocity, and transaction type shift.',
              color: '#05AB8C',
            },
            {
              step: '03',
              title: 'Flag and Explain',
              body: 'Transactions scoring above 70 surface for review. Each score includes a SHAP feature breakdown showing exactly which behaviors drove the risk — enabling regulators and analysts to audit the decision.',
              color: '#F5A800',
            },
          ].map((item) => (
            <motion.div
              key={item.step}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
              className="rounded-lg border border-[#E0E0E0] bg-white p-4 shadow-card"
            >
              <div
                className="text-2xl font-bold tabular-nums mb-3"
                style={{ color: item.color, opacity: 0.3 }}
              >
                {item.step}
              </div>
              <div className="text-sm font-semibold text-[#011E41] mb-1.5">{item.title}</div>
              <div className="text-xs text-[#4F4F4F] leading-relaxed">{item.body}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
