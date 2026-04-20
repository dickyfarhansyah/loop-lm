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
import { Input } from "@/components/ui/input"
import { useSession } from "@/hooks"

interface SidebarItem {
  icon: LucideIcon
  labelKey: string
  href: string
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { icon: Settings, labelKey: "userSettings.general", href: "/user-settings" },
  { icon: Layout, labelKey: "userSettings.interface", href: "/user-settings/interface" },
  { icon: Wrench, labelKey: "userSettings.externalTools", href: "/user-settings/external-tools" },
  { icon: Sparkles, labelKey: "userSettings.personalization", href: "/user-settings/personalization" },
  { icon: Volume2, labelKey: "userSettings.audio", href: "/user-settings/audio" },
  { icon: Database, labelKey: "userSettings.dataControls", href: "/user-settings/data-controls" },
  { icon: User, labelKey: "userSettings.account", href: "/user-settings/account" },
  { icon: Info, labelKey: "userSettings.about", href: "/user-settings/about" },
]

function UserSettingsSidebar() {
  const { t } = useTranslation()
  const { data: session } = useSession()

  
  const isAdmin = session?.role === "admin"
  return (
    <aside className="w-56 shrink-0">
      <div className="mb-4">
        <Input
          type="search"
          placeholder={t("userSettings.search")}
          className="h-9"
        />
      </div>
      <nav className="space-y-1">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/user-settings"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/50"
                )
              }
            >
              <Icon className="size-4" />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          )
        })}
      </nav>

      
      {isAdmin && (
        <div className="mt-8 pt-4 border-t">
          <NavLink
            to="/admin/settings/general"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent/50 transition-colors"
          >
            <User className="size-4" />
            <span>{t("userSettings.adminSettings")}</span>
          </NavLink>
        </div>
      )}
    </aside>
  )
}

export { UserSettingsSidebar }
