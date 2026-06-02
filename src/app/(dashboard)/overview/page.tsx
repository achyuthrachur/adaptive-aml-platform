import { getTransactionsInLastDays, getTransactions } from '@/lib/data/transactions';
import { formatCurrency } from '@/lib/utils';
import OverviewCharts from '@/components/features/Overview/OverviewCharts';

export default function OverviewPage() {
  const last30 = getTransactionsInLastDays(30);
  const allTx = getTransactions();

  const rulesAlerts = last30.filter(t => t.rule_fired).length;
  const falsePosCount = last30.filter(t => t.rule_fired && !t.is_true_positive).length;
  const modelOnlyCount = last30.filter(t => t.ml_score > 70 && !t.rule_fired).length;
  const highRiskClusters = 3;

  // Chart data
  const weekBuckets = buildWeekBuckets(allTx);
  const histogramData = buildHistogram(allTx);
  const modelOnlyCustomers = allTx.filter(t => t.ml_score > 70 && !t.rule_fired).length;

  return (
    <div>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
        <KPICard
          label="Rules Alerts (30d)"
          value={rulesAlerts.toString()}
          sublabel="transactions triggered a rule"
        />
        <KPICard
          label="Estimated False Positives"
          value={falsePosCount.toString()}
          sublabel="rule-fired, low behavioral risk"
          valueColor="#E5376B"
        />
        <KPICard
          label="Model-Only Risk Detections"
          value={modelOnlyCount.toString()}
          sublabel="high ML score, no rule fired"
          valueColor="#05AB8C"
        />
        <KPICard
          label="High-Risk Network Clusters"
          value={highRiskClusters.toString()}
          sublabel="layering, hub, sanctioned-adjacent"
          valueColor="#F5A800"
        />
      </div>

      {/* Charts */}
      <OverviewCharts
        weekBuckets={weekBuckets}
        histogramData={histogramData}
        modelOnlyAnnotation={modelOnlyCustomers}
      />
    </div>
  );
}

function KPICard({
  label,
  value,
  sublabel,
  valueColor = '#011E41',
}: {
  label: string;
  value: string;
  sublabel: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid #E0E0E0',
        borderRadius: 8,
        padding: 24,
      }}
    >
      <div style={{ fontSize: 36, fontWeight: 700, color: valueColor, lineHeight: 1 }}>{value}</div>
      <div style={{ fontWeight: 600, color: '#011E41', fontSize: 13, marginTop: 8 }}>{label}</div>
      <div style={{ color: '#828282', fontSize: 12, marginTop: 4 }}>{sublabel}</div>
    </div>
  );
}

// Build last 4 weeks of stacked bar data
function buildWeekBuckets(transactions: ReturnType<typeof getTransactions>) {
  const endDate = new Date('2024-12-01');
  const weeks = [];

  for (let w = 3; w >= 0; w--) {
    const weekEnd = new Date(endDate);
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    const startStr = weekStart.toISOString().split('T')[0];
    const endStr = weekEnd.toISOString().split('T')[0];

    const weekTx = transactions.filter(t => t.date >= startStr && t.date < endStr);

    const rule_only = weekTx.filter(t => t.rule_fired && t.ml_score <= 70).length;
    const confirmed = weekTx.filter(t => t.rule_fired && t.ml_score > 70).length;
    const model_only = weekTx.filter(t => !t.rule_fired && t.ml_score > 70).length;

    weeks.push({
      week: `Week ${4 - w}`,
      rule_only,
      confirmed,
      model_only,
    });
  }

  return weeks;
}

function buildHistogram(transactions: ReturnType<typeof getTransactions>) {
  const buckets: { range: string; count: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const min = i * 10;
    const max = min + 10;
    buckets.push({
      range: `${min}–${max}`,
      count: transactions.filter(t => t.ml_score >= min && t.ml_score < max).length,
    });
  }
  return buckets;
}
