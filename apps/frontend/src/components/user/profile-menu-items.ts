import { Archive, LogOut, Settings, ShieldCheck } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface ProfileMenuItem {
  icon: LucideIcon
  label: string
  href?: string
  action?: "logout" | "update-status" | "open-archived"
  variant?: "default" | "destructive"
}

interface ProfileMenuGroup {
  items: ProfileMenuItem[]
}

const PROFILE_MENU_GROUPS: ProfileMenuGroup[] = [
  {
    items: [
      { icon: Settings, label: "Pengaturan", href: "/user-settings" },
      { icon: Archive, label: "Obrolan yang Diarsipkan", action: "open-archived" },
      { icon: ShieldCheck, label: "Panel Admin", href: "/admin" },
    ],
  },
  {
    items: [
      { icon: LogOut, label: "Keluar", action: "logout" },
    ],
  },
]

export { PROFILE_MENU_GROUPS }
export type { ProfileMenuItem, ProfileMenuGroup }
