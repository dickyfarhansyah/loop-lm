import { NavLink } from "react-router-dom"

import { cn } from "@/lib/utils"

interface SettingsTabsProps {
  tabs: { label: string; href: string }[]
}

function SettingsTabs({ tabs }: SettingsTabsProps) {
  return (
    <div className="border-b mb-6">
      <nav className="flex gap-6">
        {tabs.map((tab) => (
          <NavLink
            key={tab.href}
            to={tab.href}
            end
            className={({ isActive }) =>
              cn(
                "pb-3 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export { SettingsTabs }
