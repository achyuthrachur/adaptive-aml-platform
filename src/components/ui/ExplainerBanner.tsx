'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface Pillar {
  icon: LucideIcon
  title: string
  body: string
  color?: string
}

interface Props {
  title: string
  insight: string
  pillars?: Pillar[]
}

export default function ExplainerBanner({ title, insight, pillars }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mb-6 rounded-lg bg-[#F0F4F8] border-l-4 border-[#011E41] p-5"
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-md font-semibold text-[#011E41] tracking-tight mb-1">{title}</h2>
          <p className="text-xs text-[#4F4F4F] leading-relaxed">{insight}</p>
        </div>
      </div>

      {pillars && pillars.length > 0 && (
        <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${pillars.length}, 1fr)` }}>
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon
            const color = pillar.color || '#011E41'
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + i * 0.06 }}
                className="flex items-start gap-3 rounded-md bg-white border border-[#E0E0E0] p-3 shadow-card"
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: color + '18' }}
                >
                  <Icon size={14} color={color} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#011E41] mb-0.5">{pillar.title}</div>
                  <div className="text-2xs text-[#828282] leading-relaxed">{pillar.body}</div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
