import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
  {
    variants: {
      variant: {
        default: "bg-[#F0F4F8] border-[#011E41] border-l-4 border-t-0 border-r-0 border-b-0 text-[#011E41]",
        destructive: "border-[#E5376B] bg-[#FEF0F4] text-[#992A5C] [&>svg]:text-[#E5376B]",
        warning: "border-[#F5A800] bg-[#FFF9E6] text-[#7A4F00] border-l-4 border-t-0 border-r-0 border-b-0 [&>svg]:text-[#F5A800]",
        info: "border-[#0075C9] bg-[#F0F7FF] text-[#0050AD] border-l-4 border-t-0 border-r-0 border-b-0 [&>svg]:text-[#0075C9]",
        success: "border-[#05AB8C] bg-[#F0FBF8] text-[#0C7876] border-l-4 border-t-0 border-r-0 border-b-0 [&>svg]:text-[#05AB8C]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-1 font-semibold leading-none tracking-tight text-sm", className)} {...props} />
  )
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-xs leading-relaxed [&_p]:leading-relaxed", className)} {...props} />
  )
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
