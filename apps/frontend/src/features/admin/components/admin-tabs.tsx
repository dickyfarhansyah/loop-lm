import { NavLink } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

function AdminTabs() {
  const { t } = useTranslation()

  const tabs = [
    { id: "users", label: t("adminPage.tabUsers"), href: "/admin" },
    { id: "evaluations", label: t("adminPage.tabEvaluations"), href: "/admin/evaluations" },
    { id: "functions", label: t("adminPage.tabFunctions"), href: "/admin/functions" },
    { id: "settings", label: t("adminPage.tabSettings"), href: "/admin/settings" },
  ]

  return (
    <nav className="flex items-center gap-1 border-b">
      {tabs.map((tab) => (
        <NavLink
          key={tab.id}
          to={tab.href}
          end={tab.href === "/admin"}
          className={({ isActive }) =>
            cn(
              "px-4 py-3 text-sm font-medium transition-colors",
              isActive
                ? "text-foreground border-b-2 border-foreground"
                : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}

export { AdminTabs }
