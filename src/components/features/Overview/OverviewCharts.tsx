'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

interface WeekBucket {
  week: string;
  rule_only: number;
  confirmed: number;
  model_only: number;
}

interface HistogramBucket {
  range: string;
  count: number;
}

interface Props {
  weekBuckets: WeekBucket[];
  histogramData: HistogramBucket[];
  modelOnlyAnnotation: number;
}

export default function OverviewCharts({ weekBuckets, histogramData, modelOnlyAnnotation }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      {/* Left — Alert Disposition */}
      <div style={{ backgroundColor: '#011E41', borderRadius: 8, padding: 24 }}>
        <h3 style={{ color: 'white', fontSize: 14, fontWeight: 600, margin: '0 0 20px' }}>
          Alert Disposition Breakdown
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={weekBuckets} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="week" tick={{ fill: 'white', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.3)' }} tickLine={false} />
            <YAxis tick={{ fill: 'white', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#002E62', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: 'white', fontSize: 12 }}
              labelStyle={{ color: 'white', fontWeight: 600 }}
            />
            <Legend
              wrapperStyle={{ color: 'white', fontSize: 12, paddingTop: 12 }}
              formatter={(value) => {
                const labels: Record<string, string> = {
                  rule_only: 'Rules Only (Est. FP)',
                  confirmed: 'Confirmed (Both)',
                  model_only: 'Model Only',
                };
                return labels[value] || value;
              }}
            />
            <Bar dataKey="rule_only" stackId="a" fill="#F5A800" name="rule_only" />
            <Bar dataKey="confirmed" stackId="a" fill="#05AB8C" name="confirmed" />
            <Bar dataKey="model_only" stackId="a" fill="#0075C9" name="model_only" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Right — Risk Score Distribution */}
      <div style={{ backgroundColor: '#011E41', borderRadius: 8, padding: 24 }}>
        <h3 style={{ color: 'white', fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>
          Risk Score Distribution
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '0 0 16px' }}>
          {modelOnlyAnnotation} transactions above 70 not flagged by rules
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={histogramData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="range"
              tick={{ fill: 'white', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
              tickLine={false}
              angle={-30}
              textAnchor="end"
              height={45}
            />
            <YAxis tick={{ fill: 'white', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#002E62', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: 'white', fontSize: 12 }}
              labelStyle={{ color: 'white', fontWeight: 600 }}
              formatter={(v) => [v, 'Transactions']}
            />
            <Bar dataKey="count" fill="#0075C9" radius={[3, 3, 0, 0]} name="Transactions" />
            <ReferenceLine
              x="70–80"
              stroke="#F5A800"
              strokeWidth={2}
              label={{ value: 'Rules Threshold', fill: '#F5A800', fontSize: 11, position: 'top' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
