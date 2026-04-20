import { NavLink } from "react-router-dom"
import {
  Settings,
  Plug,
  Box,
  Layout,
  Volume2,
  Database,
  MessageSquare,
  ListTodo,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

interface SidebarItem {
  icon: LucideIcon
  label: string
  href: string
}

function SettingsSidebar() {
  const { t } = useTranslation()

  const SIDEBAR_ITEMS: SidebarItem[] = [
    { icon: Settings, label: t("settingsPage.sidebarGeneral"), href: "/admin/settings/general" },
    { icon: Plug, label: t("settingsPage.sidebarConnections"), href: "/admin/settings/connections" },
    { icon: Box, label: t("settingsPage.sidebarModels"), href: "/admin/settings/models" },
    { icon: MessageSquare, label: t("settingsPage.sidebarSystemPrompts"), href: "/admin/settings/system-prompts" },
    { icon: ListTodo, label: t("settingsPage.sidebarTasks"), href: "/admin/settings/tasks" },
    { icon: Layout, label: t("settingsPage.sidebarInterface"), href: "/admin/settings/interface" },
    { icon: Volume2, label: t("settingsPage.sidebarAudio"), href: "/admin/settings/audio" },
    { icon: Database, label: t("settingsPage.sidebarDatabase"), href: "/admin/settings/database" },
  ]

  return (
    <aside className="hidden md:block w-56 shrink-0">
      <nav className="space-y-1">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.href}
              to={item.href}
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
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

function SettingsMobileTabs() {
  const { t } = useTranslation()

  const SIDEBAR_ITEMS: SidebarItem[] = [
    { icon: Settings, label: t("settingsPage.sidebarGeneral"), href: "/admin/settings/general" },
    { icon: Plug, label: t("settingsPage.sidebarConnections"), href: "/admin/settings/connections" },
    { icon: Box, label: t("settingsPage.sidebarModels"), href: "/admin/settings/models" },
    { icon: MessageSquare, label: t("settingsPage.sidebarSystemPrompts"), href: "/admin/settings/system-prompts" },
    { icon: ListTodo, label: t("settingsPage.sidebarTasks"), href: "/admin/settings/tasks" },
    { icon: Layout, label: t("settingsPage.sidebarInterface"), href: "/admin/settings/interface" },
    { icon: Volume2, label: t("settingsPage.sidebarAudio"), href: "/admin/settings/audio" },
    { icon: Database, label: t("settingsPage.sidebarDatabase"), href: "/admin/settings/database" },
  ]
  return (
    <div className="md:hidden -mx-4 px-4 mb-4 overflow-x-auto scrollbar-hide">
      <nav className="flex gap-2 pb-2 min-w-max">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 rounded-full text-sm whitespace-nowrap transition-colors border",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary font-medium"
                    : "bg-background text-muted-foreground border-border hover:bg-accent/50"
                )
              }
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}

export { SettingsSidebar, SettingsMobileTabs }
