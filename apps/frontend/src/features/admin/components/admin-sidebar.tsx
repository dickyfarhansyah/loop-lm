import { Users, Layers } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

interface AdminSidebarItemProps {
  icon: React.ReactNode
  label: string
  isActive?: boolean
  onClick?: () => void
}

function AdminSidebarItem({ icon, label, isActive, onClick }: AdminSidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center cursor-pointer gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors",
        isActive
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground hover:bg-accent/50"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

interface AdminSidebarProps {
  activeItem: string
  onItemChange: (item: string) => void
}

function AdminSidebar({ activeItem, onItemChange }: AdminSidebarProps) {
  const { t } = useTranslation()

  const items = [
    { id: "overview", icon: <Users className="size-4" />, label: t("adminPage.sidebarOverview") },
    { id: "groups", icon: <Layers className="size-4" />, label: t("adminPage.sidebarGroups") },
  ]

  return (
    <aside className="hidden md:block w-56 shrink-0">
      <nav className="space-y-1">
        {items.map((item) => (
          <AdminSidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activeItem === item.id}
            onClick={() => onItemChange(item.id)}
          />
        ))}
      </nav>
    </aside>
  )
}

export { AdminSidebar }
