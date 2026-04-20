import { NavLink } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Settings,
  Layout,
  Wrench,
  Sparkles,
  Volume2,
  Database,
  User,
  Info,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface TabItem {
  icon: LucideIcon
  labelKey: string
  href: string
}

const TAB_ITEMS: TabItem[] = [
  { icon: Settings, labelKey: "userSettings.general", href: "/user-settings" },
  { icon: Layout, labelKey: "userSettings.interface", href: "/user-settings/interface" },
  { icon: Wrench, labelKey: "userSettings.externalTools", href: "/user-settings/external-tools" },
  { icon: Sparkles, labelKey: "userSettings.personalization", href: "/user-settings/personalization" },
  { icon: Volume2, labelKey: "userSettings.audio", href: "/user-settings/audio" },
  { icon: Database, labelKey: "userSettings.dataControls", href: "/user-settings/data-controls" },
  { icon: User, labelKey: "userSettings.account", href: "/user-settings/account" },
  { icon: Info, labelKey: "userSettings.about", href: "/user-settings/about" },
]

function UserSettingsTabs() {
  const { t } = useTranslation()
  return (
    <div className="overflow-x-auto scrollbar-hide">
      <nav className="flex gap-2 p-3 min-w-max">
        {TAB_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/user-settings"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors border",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary font-medium"
                    : "bg-background text-muted-foreground border-border hover:bg-accent/50"
                )
              }
            >
              <Icon className="size-4" />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}

export { UserSettingsTabs }
