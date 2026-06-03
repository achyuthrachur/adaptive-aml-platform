'use client'

import { HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './tooltip'

interface Props {
  term: string
  definition: string
  children: React.ReactNode
}

export default function TermTooltip({ term, definition, children }: Props) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help group">
            {children}
            <HelpCircle
              size={11}
              className="text-[#BDBDBD] group-hover:text-[#828282] transition-colors flex-shrink-0"
            />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold mb-0.5">{term}</p>
          <p className="text-slate-300 leading-relaxed">{definition}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
