import { getTransactionsInLastDays, getTransactions } from '@/lib/data/transactions'
import { formatCurrency } from '@/lib/utils'
import OverviewCharts from '@/components/features/Overview/OverviewCharts'
import OverviewClient from '@/components/features/Overview/OverviewClient'

export default function OverviewPage() {
  const last30 = getTransactionsInLastDays(30)
  const allTx = getTransactions()

  const rulesAlerts = last30.filter(t => t.rule_fired).length
  const falsePosCount = last30.filter(t => t.rule_fired && !t.is_true_positive).length
  const modelOnlyCount = last30.filter(t => t.ml_score > 70 && !t.rule_fired).length
  const highRiskClusters = 3
  const ruleCaughtPct = allTx.length > 0
    ? Math.round((allTx.filter(t => t.rule_fired && t.ml_score > 70).length / allTx.filter(t => t.ml_score > 70).length) * 100)
    : 0

  const weekBuckets = buildWeekBuckets(allTx)
  const histogramData = buildHistogram(allTx)
  const modelOnlyTotal = allTx.filter(t => t.ml_score > 70 && !t.rule_fired).length

  return (
    <OverviewClient
      rulesAlerts={rulesAlerts}
      falsePosCount={falsePosCount}
      modelOnlyCount={modelOnlyCount}
      highRiskClusters={highRiskClusters}
      ruleCaughtPct={ruleCaughtPct}
      weekBuckets={weekBuckets}
      histogramData={histogramData}
      modelOnlyTotal={modelOnlyTotal}
    />
  )
}

function buildWeekBuckets(transactions: ReturnType<typeof getTransactions>) {
  const endDate = new Date('2024-12-01')
  const weeks = []
  for (let w = 3; w >= 0; w--) {
    const weekEnd = new Date(endDate)
    weekEnd.setDate(weekEnd.getDate() - w * 7)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekStart.getDate() - 7)
    const startStr = weekStart.toISOString().split('T')[0]
    const endStr = weekEnd.toISOString().split('T')[0]
    const weekTx = transactions.filter(t => t.date >= startStr && t.date < endStr)
    weeks.push({
      week: `Week ${4 - w}`,
      rule_only: weekTx.filter(t => t.rule_fired && t.ml_score <= 70).length,
      confirmed: weekTx.filter(t => t.rule_fired && t.ml_score > 70).length,
      model_only: weekTx.filter(t => !t.rule_fired && t.ml_score > 70).length,
    })
  }
  return weeks
}

function buildHistogram(transactions: ReturnType<typeof getTransactions>) {
  return Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}–${i * 10 + 10}`,
    count: transactions.filter(t => t.ml_score >= i * 10 && t.ml_score < i * 10 + 10).length,
  }))
}
