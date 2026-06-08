'use client'

import { useEffect, useRef } from 'react'
import { motion, useInView, animate, useMotionValue, useTransform } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Props {
  label: string
  value: string
  sublabel?: string
  valueColor?: string
  trend?: { direction: 'up' | 'down' | 'flat'; label?: string }
}

function AnimatedNumber({ raw, color }: { raw: string; color: string }) {
  const num = parseInt(raw.replace(/[^0-9]/g, ''), 10)
  const prefix = raw.match(/^[^0-9]*/)?.[0] || ''
  const suffix = raw.match(/[^0-9]*$/)?.[0] || ''
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => `${prefix}${Math.round(v).toLocaleString()}${suffix}`)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView || isNaN(num)) return
    const ctrl = animate(count, num, { duration: 1.8, ease: [0.16, 1, 0.3, 1] })
    return ctrl.stop
  }, [inView, num, count])

  if (isNaN(num)) {
    return <div style={{ fontSize: 36, fontWeight: 700, color, lineHeight: 1 }}>{raw}</div>
  }

  return (
    <div ref={ref} className="tabular-nums" style={{ fontSize: 36, fontWeight: 700, color, lineHeight: 1 }}>
      <motion.span>{rounded}</motion.span>
    </div>
  )
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
      transition={{ duration: 0.2 }}
      className="rounded-lg border border-[#E0E0E0] bg-white p-5 shadow-card"
    >
      <AnimatedNumber raw={value} color={valueColor} />
      <div className="text-sm font-semibold text-[#011E41] mt-2 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        {sublabel && <span className="text-xs text-[#828282]">{sublabel}</span>}
        {trend && (
          <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: trendColor }}>
            {trendIcon}{trend.label}
          </span>
        )}
      </div>
    </motion.div>
  )
}
