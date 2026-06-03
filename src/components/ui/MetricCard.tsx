'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Props {
  label: string
  value: string
  sublabel?: string
  valueColor?: string
  trend?: { direction: 'up' | 'down' | 'flat'; label?: string }
}

export default function MetricCard({ label, value, sublabel, valueColor = '#011E41', trend }: Props) {
  const trendIcon = trend?.direction === 'up'
    ? <TrendingUp size={13} />
    : trend?.direction === 'down'
    ? <TrendingDown size={13} />
    : <Minus size={13} />

  const trendColor = trend?.direction === 'up' ? '#E5376B' : trend?.direction === 'down' ? '#05AB8C' : '#828282'

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
      transition={{ duration: 0.15 }}
      className="rounded-lg border border-[#E0E0E0] bg-white p-5 shadow-card"
    >
      <div
        className="tabular-nums font-bold leading-none mb-2"
        style={{ fontSize: 36, color: valueColor }}
      >
        {value}
      </div>
      <div className="text-sm font-semibold text-[#011E41] mb-1">{label}</div>
      <div className="flex items-center gap-2">
        {sublabel && <span className="text-xs text-[#828282]">{sublabel}</span>}
        {trend && (
          <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: trendColor }}>
            {trendIcon}
            {trend.label}
          </span>
        )}
      </div>
    </motion.div>
  )
}
