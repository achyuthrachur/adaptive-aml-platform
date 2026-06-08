import { getTransactionsInLastDays, getTransactions } from '@/lib/data/transactions'
import { getCustomers } from '@/lib/data/customers'
import OverviewClient from '@/components/features/Overview/OverviewClient'
import { FEATURE_LABELS } from '@/lib/utils'

export default function OverviewPage() {
  const last30 = getTransactionsInLastDays(30)
  const allTx = getTransactions()
  const customers = getCustomers()
  const customerMap = Object.fromEntries(customers.map(c => [c.id, c]))

  const rulesAlerts = last30.filter(t => t.rule_fired).length
  const falsePosCount = last30.filter(t => t.rule_fired && !t.is_true_positive).length
  const modelOnlyCount = last30.filter(t => t.ml_score > 70 && !t.rule_fired).length
  const highRiskClusters = 3
  const highRiskAll = allTx.filter(t => t.ml_score > 70)
  const confirmedBoth = highRiskAll.filter(t => t.rule_fired).length
  const ruleCaughtPct = highRiskAll.length > 0 ? Math.round((confirmedBoth / highRiskAll.length) * 100) : 0

  const weekBuckets = buildWeekBuckets(allTx)
  const histogramData = buildHistogram(allTx)
  const modelOnlyTotal = allTx.filter(t => t.ml_score > 70 && !t.rule_fired).length

  // Top 8 highest-scored transactions for the alerts table
  const topAlerts = [...allTx]
    .sort((a, b) => b.ml_score - a.ml_score)
    .slice(0, 8)
    .map(tx => {
      const customer = customerMap[tx.customer_id]
      const featureEntries = Object.entries(tx.ml_features) as [keyof typeof tx.ml_features, number][]
      featureEntries.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      return {
        id: tx.id,
        customer: customer?.name || tx.customer_id,
        segment: customer ? {
          private_wealth: 'Private Wealth', corporate_treasury: 'Corp Treasury',
          correspondent_banking: 'Correspondent', retail: 'Retail',
        }[customer.segment] : '',
        amount: tx.amount,
        score: tx.ml_score,
        feature: FEATURE_LABELS[featureEntries[0]?.[0]] || '',
        date: tx.date,
      }
    })

  return (
    <OverviewClient
      rulesAlerts={rulesAlerts} falsePosCount={falsePosCount}
      modelOnlyCount={modelOnlyCount} highRiskClusters={highRiskClusters}
      ruleCaughtPct={ruleCaughtPct} weekBuckets={weekBuckets}
      histogramData={histogramData} modelOnlyTotal={modelOnlyTotal}
      topAlerts={topAlerts}
    />
  )
}

function buildWeekBuckets(transactions: ReturnType<typeof getTransactions>) {
  const endDate = new Date('2024-12-01')
  return Array.from({ length: 4 }, (_, i) => {
    const w = 3 - i
    const weekEnd = new Date(endDate); weekEnd.setDate(weekEnd.getDate() - w * 7)
    const weekStart = new Date(weekEnd); weekStart.setDate(weekStart.getDate() - 7)
    const s = weekStart.toISOString().split('T')[0]; const e = weekEnd.toISOString().split('T')[0]
    const wt = transactions.filter(t => t.date >= s && t.date < e)
    return {
      week: `Week ${4 - w}`,
      rule_only: wt.filter(t => t.rule_fired && t.ml_score <= 70).length,
      confirmed: wt.filter(t => t.rule_fired && t.ml_score > 70).length,
      model_only: wt.filter(t => !t.rule_fired && t.ml_score > 70).length,
    }
  })
}

function buildHistogram(transactions: ReturnType<typeof getTransactions>) {
  return Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}–${i * 10 + 10}`,
    count: transactions.filter(t => t.ml_score >= i * 10 && t.ml_score < i * 10 + 10).length,
  }))
}
