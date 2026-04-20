import { UserAvatar } from "./user-avatar"
import { UserStatus, type StatusType } from "./user-status"
import { cn } from "@/lib/utils"

interface UserProfileHeaderProps {
  name: string
  avatarSrc?: string
  status: StatusType
  avatarSize?: "sm" | "md" | "lg"
  className?: string
}

function UserProfileHeader({
  name,
  avatarSrc,
  status,
  avatarSize = "lg",
  className,
}: UserProfileHeaderProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <UserAvatar name={name} src={avatarSrc} size={avatarSize} />
      <div className="flex flex-col">
        <span className="text-sm font-semibold">{name}</span>
        <UserStatus status={status} />
      </div>
    </div>
  )
}

export { UserProfileHeader }
