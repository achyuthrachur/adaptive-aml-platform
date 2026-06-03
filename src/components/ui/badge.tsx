import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#011E41] text-white",
        secondary: "border-transparent bg-slate-100 text-[#011E41]",
        destructive: "border-transparent bg-[#E5376B] text-white",
        outline: "border-[#E0E0E0] text-[#011E41]",
        amber: "border-transparent bg-[#FFF3CC] text-[#7A4F00]",
        teal: "border-transparent bg-[#D1F5EF] text-[#0C7876]",
        coral: "border-transparent bg-[#FDDDE6] text-[#992A5C]",
        indigo: "border-transparent bg-[#011E41] text-white",
        "outline-amber": "border-[#F5A800] text-[#7A4F00] bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
