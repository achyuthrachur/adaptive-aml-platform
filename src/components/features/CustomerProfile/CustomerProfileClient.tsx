'use client';

import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import type { Customer } from '@/types/customer';
import type { Transaction } from '@/types/transaction';
import { formatCurrency, formatDate, getRiskColor, FEATURE_LABELS } from '@/lib/utils';

const SEGMENT_LABELS: Record<string, string> = {
  private_wealth: 'Private Wealth',
  corporate_treasury: 'Corporate Treasury',
  correspondent_banking: 'Correspondent Banking',
  retail: 'Retail',
};

const TX_TYPE_COLORS: Record<string, string> = {
  wire: '#F5A800',
  ach: '#05AB8C',
  check: '#0075C9',
  fx: '#B14FC5',
};

interface Props {
  customer: Customer;
  transactions: Transaction[];
  peerGroupSize: number;
  peerAvgVolume: number;
  peerAvgTx: number;
  volumeDelta: number;
  txDelta: number;
}

export default function CustomerProfileClient({
  customer,
  transactions,
  peerGroupSize,
  peerAvgVolume,
  peerAvgTx,
  volumeDelta,
  txDelta,
}: Props) {
  const router = useRouter();
  const riskColor = getRiskColor(customer.risk_score);

  // Build weekly volume data (90 days)
  const volumeData = buildWeeklyVolume(transactions, customer.baseline_monthly_volume / 4);

  // Build corridor heatmap data
  const corridorData = buildCorridorHeatmap(transactions, customer.baseline_corridors);

  // Transaction type breakdown
  const txTypeCounts = buildTxTypeCounts(transactions);

  // Drift score over time
  const driftData = buildDriftScore(transactions);

  const recentTx = transactions.slice(0, 20);

  const deltaStyle = (delta: number): React.CSSProperties => ({
    color: Math.abs(delta) > 20 ? (delta > 0 ? '#E5376B' : '#05AB8C') : '#828282',
    fontWeight: 600,
  });

  return (
    <div style={{ display: 'flex', gap: 24, minHeight: 0 }}>
      {/* Left column */}
      <div style={{ width: 320, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Customer header card */}
        <div style={{ backgroundColor: '#011E41', borderRadius: 8, padding: 24, color: 'white' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>{customer.name}</h2>
          <span style={{
            backgroundColor: 'rgba(255,255,255,0.15)',
            color: 'white',
            padding: '2px 10px',
            borderRadius: 4,
            fontSize: 11,
            display: 'inline-block',
            marginBottom: 16,
          }}>
            {SEGMENT_LABELS[customer.segment]}
          </span>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>
            Peer Group {customer.peer_group}
          </div>

          <div style={{ fontSize: 48, fontWeight: 700, color: riskColor, lineHeight: 1, marginBottom: 4 }}>
            {customer.risk_score}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>Risk Score</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <StatRow label="Avg Monthly Volume" value={formatCurrency(customer.baseline_monthly_volume)} />
            <StatRow label="Avg Transaction Count" value={`${customer.baseline_transaction_count}/mo`} />
            <StatRow label="Primary Corridors" value={customer.baseline_corridors.slice(0, 2).join(', ')} />
          </div>
        </div>

        {/* Peer group comparison */}
        <div style={{ backgroundColor: 'white', border: '1px solid #E0E0E0', borderRadius: 8, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#011E41' }}>
            Peer Group {customer.peer_group}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <PeerRow label="Customers in Group" value={peerGroupSize.toString()} />
            <PeerRow label="Avg Group Volume" value={formatCurrency(peerAvgVolume)} />
            <PeerRow label="Avg Group Transactions" value={`${peerAvgTx}/mo`} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingTop: 8, borderTop: '1px solid #F0F0F0' }}>
              <span style={{ color: '#828282' }}>Volume vs Group</span>
              <span style={deltaStyle(volumeDelta)}>{volumeDelta > 0 ? '+' : ''}{volumeDelta}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#828282' }}>Transactions vs Group</span>
              <span style={deltaStyle(txDelta)}>{txDelta > 0 ? '+' : ''}{txDelta}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Volume chart */}
        <ChartCard title="Transaction Volume Over Time">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={volumeData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#828282' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#828282' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [formatCurrency(v), '']} labelStyle={{ fontWeight: 600 }} />
              <Line type="monotone" dataKey="volume" stroke="#F5A800" strokeWidth={2} dot={false} name="This Customer" />
              <Line type="monotone" dataKey="peerAvg" stroke="#0075C9" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Peer Avg" />
              {volumeData.map((d, i) =>
                d.anomaly ? (
                  <ReferenceLine key={i} x={d.week} stroke="#E5376B" strokeDasharray="3 3" label={{ value: 'Anomaly', fill: '#E5376B', fontSize: 10 }} />
                ) : null
              )}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Corridor Heatmap */}
        <ChartCard title="Corridor Activity Heatmap">
          <CorridorHeatmap data={corridorData} baselineCorridors={customer.baseline_corridors} />
        </ChartCard>

        {/* Two columns: donut + drift */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <ChartCard title="Transaction Type Breakdown">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <PieChart width={160} height={160}>
                <Pie data={txTypeCounts} cx={75} cy={75} innerRadius={50} outerRadius={72} dataKey="value" paddingAngle={2}>
                  {txTypeCounts.map((entry) => (
                    <Cell key={entry.name} fill={TX_TYPE_COLORS[entry.name] || '#BDBDBD'} />
                  ))}
                </Pie>
                <text x={80} y={155} textAnchor="middle" fontSize={10} fill="#828282">Transaction Mix</text>
              </PieChart>
              <div style={{ marginLeft: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {txTypeCounts.map(e => (
                  <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: TX_TYPE_COLORS[e.name] || '#BDBDBD' }} />
                    <span style={{ color: '#011E41', textTransform: 'capitalize' }}>{e.name}</span>
                    <span style={{ color: '#828282' }}>({e.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          <ChartCard title="Behavioral Drift Score Over Time">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={driftData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#828282' }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#828282' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [v.toFixed(1), 'Drift Score']} />
                <defs>
                  <linearGradient id="driftGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E5376B" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#E5376B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="score" stroke="#0075C9" strokeWidth={2} fill="url(#driftGradient)" dot={false} />
                <ReferenceLine y={60} stroke="#F5A800" strokeDasharray="4 4" label={{ value: 'Review Threshold', fill: '#F5A800', fontSize: 10, position: 'right' }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Recent transactions */}
        <ChartCard title={`Recent Transactions (last ${recentTx.length})`}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'Arial, sans-serif' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8F8F8', borderBottom: '1px solid #E0E0E0' }}>
                  {['Date', 'Amount', 'Dir', 'Counterparty', 'Jurisdiction', 'Rule', 'ML Score', ''].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, color: '#828282', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTx.map(tx => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #F5F5F5' }}>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{formatDate(tx.date)}</td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{formatCurrency(tx.amount)}</td>
                    <td style={{ padding: '8px 10px', textTransform: 'capitalize', color: tx.direction === 'outbound' ? '#E5376B' : '#05AB8C' }}>{tx.direction}</td>
                    <td style={{ padding: '8px 10px', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.counterparty_name}</td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{tx.counterparty_jurisdiction}</td>
                    <td style={{ padding: '8px 10px' }}>
                      {tx.rule_fired
                        ? <span style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '1px 6px', borderRadius: 3, fontSize: 11 }}>Fired</span>
                        : <span style={{ backgroundColor: '#F3F4F6', color: '#6B7280', padding: '1px 6px', borderRadius: 3, fontSize: 11 }}>Clear</span>
                      }
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ color: getRiskColor(tx.ml_score), fontWeight: 600 }}>{tx.ml_score}</span>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <button
                        onClick={() => router.push(`/transactions?selected=${tx.id}`)}
                        style={{ fontSize: 11, color: '#0075C9', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'Arial, sans-serif' }}
                      >
                        Detail →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
      <span style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
      <span style={{ color: 'white', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  );
}

function PeerRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ color: '#828282' }}>{label}</span>
      <span style={{ color: '#011E41', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: 'white', border: '1px solid #E0E0E0', borderRadius: 8, padding: 20 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 600, color: '#011E41' }}>{title}</h3>
      {children}
    </div>
  );
}

// --- Data helpers ---

function buildWeeklyVolume(transactions: Transaction[], peerWeekAvg: number) {
  const weeks: { week: string; volume: number; peerAvg: number; anomaly: boolean }[] = [];
  const endDate = new Date('2024-12-01');

  for (let w = 12; w >= 1; w--) {
    const weekEnd = new Date(endDate);
    weekEnd.setDate(weekEnd.getDate() - (w - 1) * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    const startStr = weekStart.toISOString().split('T')[0];
    const endStr = weekEnd.toISOString().split('T')[0];

    const vol = transactions
      .filter(t => t.date >= startStr && t.date < endStr)
      .reduce((s, t) => s + t.amount, 0);

    weeks.push({
      week: `W${13 - w}`,
      volume: vol,
      peerAvg: peerWeekAvg,
      anomaly: vol > peerWeekAvg * 2,
    });
  }

  return weeks;
}

function buildCorridorHeatmap(transactions: Transaction[], baselineCorridors: string[]) {
  const endDate = new Date('2024-12-01');
  const weeks: string[] = [];
  for (let w = 12; w >= 1; w--) {
    weeks.push(`W${13 - w}`);
  }

  // Get all unique jurisdictions
  const allJurisdictions = Array.from(new Set(transactions.map(t => t.counterparty_jurisdiction)));

  const data = allJurisdictions.map(jurisdiction => {
    const isNew = !baselineCorridors.includes(jurisdiction);
    const weeklyVolumes = weeks.map((_, wi) => {
      const endW = new Date(endDate);
      endW.setDate(endW.getDate() - (12 - wi - 1) * 7);
      const startW = new Date(endW);
      startW.setDate(startW.getDate() - 7);

      const vol = transactions
        .filter(t => t.counterparty_jurisdiction === jurisdiction && t.date >= startW.toISOString().split('T')[0] && t.date < endW.toISOString().split('T')[0])
        .reduce((s, t) => s + t.amount, 0);
      return vol;
    });

    const maxVol = Math.max(...weeklyVolumes);
    return { jurisdiction, isNew, weeklyVolumes, maxVol };
  });

  return { data, weeks };
}

function buildTxTypeCounts(transactions: Transaction[]) {
  const counts: Record<string, number> = { wire: 0, ach: 0, check: 0, fx: 0 };
  for (const tx of transactions) {
    counts[tx.transaction_type] = (counts[tx.transaction_type] || 0) + 1;
  }
  return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
}

function buildDriftScore(transactions: Transaction[]) {
  const endDate = new Date('2024-12-01');
  const result: { week: string; score: number }[] = [];

  for (let w = 12; w >= 1; w--) {
    const endW = new Date(endDate);
    endW.setDate(endW.getDate() - (w - 1) * 7);
    const startW = new Date(endW);
    startW.setDate(startW.getDate() - 7);

    const weekTx = transactions.filter(
      t => t.date >= startW.toISOString().split('T')[0] && t.date < endW.toISOString().split('T')[0]
    );

    let avgDrift = 0;
    if (weekTx.length > 0) {
      const featureSum = weekTx.reduce((s, t) => {
        const vals = Object.values(t.ml_features);
        return s + vals.reduce((a, b) => a + Math.abs(b), 0) / vals.length;
      }, 0);
      avgDrift = Math.min(100, (featureSum / weekTx.length) * 6);
    }

    result.push({ week: `W${13 - w}`, score: Math.round(avgDrift) });
  }

  return result;
}

function CorridorHeatmap({
  data,
  baselineCorridors,
}: {
  data: ReturnType<typeof buildCorridorHeatmap>;
  baselineCorridors: string[];
}) {
  const globalMax = Math.max(...data.data.flatMap(d => d.weeklyVolumes));

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ padding: '4px 8px', textAlign: 'left', color: '#828282', fontSize: 10, minWidth: 140 }}>Jurisdiction</th>
            {data.weeks.map(w => (
              <th key={w} style={{ padding: '4px 6px', color: '#828282', fontSize: 10, minWidth: 36, textAlign: 'center' }}>{w}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.data.map(row => (
            <tr key={row.jurisdiction}>
              <td style={{
                padding: '3px 8px',
                color: row.isNew ? '#F5A800' : '#011E41',
                fontWeight: row.isNew ? 600 : 400,
                whiteSpace: 'nowrap',
                fontSize: 11,
              }}>
                {row.isNew ? '★ ' : ''}{row.jurisdiction}
              </td>
              {row.weeklyVolumes.map((vol, wi) => {
                const intensity = globalMax > 0 ? vol / globalMax : 0;
                const bg = interpolateColor('#FFFFFF', '#011E41', intensity);
                return (
                  <td
                    key={wi}
                    title={`$${vol.toLocaleString()}`}
                    style={{
                      width: 36,
                      height: 24,
                      backgroundColor: bg,
                      border: row.isNew ? '1px solid #F5A800' : '1px solid #F0F0F0',
                      borderRadius: 2,
                    }}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function interpolateColor(c1: string, c2: string, t: number): string {
  const hex2rgb = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = hex2rgb(c1);
  const [r2, g2, b2] = hex2rgb(c2);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}
