'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts'

interface Props {
  weekBuckets: { week: string; rule_only: number; confirmed: number; model_only: number }[]
  histogramData: { range: string; count: number }[]
  modelOnlyAnnotation: number
  ruleCaughtPct: number
}

const CustomTooltipDark = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-white/10 bg-[#011E41] p-3 text-xs shadow-card-lg">
      <p className="font-semibold text-white mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-white/80">
          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span>{p.name}: <strong className="text-white">{p.value}</strong></span>
        </div>
      ))}
    </div>
  )
}

export default function OverviewCharts({ weekBuckets, histogramData, modelOnlyAnnotation, ruleCaughtPct }: Props) {
  return (
    <div className="grid grid-cols-2 gap-5">
      {/* Alert Disposition */}
      <div className="rounded-lg p-5" style={{ background: 'linear-gradient(135deg, #011E41 0%, #01152E 100%)' }}>
        <div className="mb-1">
          <h3 className="text-sm font-semibold text-white">Alert Disposition by Week</h3>
          <p className="text-xs text-white/50 mt-0.5">Amber = est. false positive · Teal = confirmed by model · Blue = model-only catch</p>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={weekBuckets} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip content={<CustomTooltipDark />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
              formatter={(v) => {
                const labels: Record<string, string> = { rule_only: 'Rules-only (est. FP)', confirmed: 'Confirmed by both', model_only: 'Model-only catch' }
                return <span style={{ color: 'rgba(255,255,255,0.7)' }}>{labels[v] || v}</span>
              }}
            />
            <Bar dataKey="rule_only" stackId="a" fill="#F5A800" name="rule_only" />
            <Bar dataKey="confirmed" stackId="a" fill="#05AB8C" name="confirmed" />
            <Bar dataKey="model_only" stackId="a" fill="#0075C9" name="model_only" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Risk Score Distribution */}
      <div className="rounded-lg p-5" style={{ background: 'linear-gradient(135deg, #011E41 0%, #01152E 100%)' }}>
        <div className="mb-1">
          <h3 className="text-sm font-semibold text-white">ML Risk Score Distribution</h3>
          <p className="text-xs text-white/50 mt-0.5">
            {modelOnlyAnnotation} transactions above threshold not caught by rules — rules detected only {ruleCaughtPct}% of high-risk activity
          </p>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={histogramData} margin={{ top: 16, right: 8, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="range"
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
              axisLine={false} tickLine={false}
              angle={-35} textAnchor="end" height={44}
            />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip
              content={<CustomTooltipDark />}
              formatter={(v) => [v, 'Transactions']}
            />
            <Bar dataKey="count" fill="#0075C9" radius={[3, 3, 0, 0]} name="Transactions" />
            <ReferenceLine
              x="70–80"
              stroke="#F5A800"
              strokeWidth={2}
              strokeDasharray="4 3"
              label={{ value: '70 · Review threshold', fill: '#F5A800', fontSize: 10, position: 'insideTopRight' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
