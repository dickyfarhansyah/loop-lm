import { cn } from "@/lib/utils"

interface StatusIndicatorProps {
  status: "online" | "offline" | "away"
  className?: string
}

function StatusIndicator({ status, className }: StatusIndicatorProps) {
  const statusColors = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    away: "bg-yellow-500",
  }

  return (
    <span
      className={cn(
        "inline-block size-2.5 rounded-full",
        statusColors[status],
        className
      )}
    />
  )
}

export { StatusIndicator }
