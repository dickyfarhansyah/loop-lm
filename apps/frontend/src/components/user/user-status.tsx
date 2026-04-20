import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

type StatusType = "active" | "away" | "busy" | "offline"

interface UserStatusProps {
  status: StatusType
  showLabel?: boolean
  className?: string
}

const statusConfig = {
  active: { color: "bg-green-500", textColor: "text-green-500" },
  away: { color: "bg-yellow-500", textColor: "text-yellow-500" },
  busy: { color: "bg-red-500", textColor: "text-red-500" },
  offline: { color: "bg-gray-400", textColor: "text-gray-400" },
}

function UserStatus({ status, showLabel = true, className }: UserStatusProps) {
  const { t } = useTranslation()
  const config = statusConfig[status]

  return (
    <span className={cn("flex items-center gap-1 text-xs", config.textColor, className)}>
      <span className={cn("size-2 rounded-full", config.color)} />
      {showLabel && t(`userStatus.${status}`)}
    </span>
  )
}

export { UserStatus }
export type { StatusType }
