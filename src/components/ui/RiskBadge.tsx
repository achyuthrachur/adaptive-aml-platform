import { Badge } from './badge'

interface Props {
  score?: number
  level?: 'low' | 'medium' | 'high'
  size?: 'sm' | 'default'
}

export default function RiskBadge({ score, level, size = 'default' }: Props) {
  const resolved = level ?? (score !== undefined
    ? score < 40 ? 'low' : score <= 70 ? 'medium' : 'high'
    : 'low')

  const config = {
    low: { variant: 'teal' as const, label: score !== undefined ? String(score) : 'Low' },
    medium: { variant: 'amber' as const, label: score !== undefined ? String(score) : 'Medium' },
    high: { variant: 'coral' as const, label: score !== undefined ? String(score) : 'High' },
  }

  const { variant, label } = config[resolved]

  return (
    <Badge
      variant={variant}
      className={size === 'sm' ? 'text-2xs px-1.5 py-0' : 'font-semibold tabular-nums'}
    >
      {label}
    </Badge>
  )
}
