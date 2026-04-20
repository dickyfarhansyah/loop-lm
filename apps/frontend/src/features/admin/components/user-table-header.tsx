import * as React from "react"
import { Search, Plus, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AddUserDialog } from "./add-user-dialog"

interface UserTableHeaderProps {
  title: string
  count: number
  onSearch?: (query: string) => void
}

function UserTableHeader({ title, count, onSearch }: UserTableHeaderProps) {
  const { t } = useTranslation()
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleOpenSearch = () => {
    setSearchOpen(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleClearSearch = () => {
    setQuery("")
    onSearch?.("")
    setSearchOpen(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    onSearch?.(e.target.value)
  }

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm text-muted-foreground bg-muted rounded-full px-2 py-0.5">{count}</span>
      </div>
      <div className="flex items-center gap-2">
        {searchOpen ? (
          <div className="flex items-center gap-1">
            <Input
              ref={inputRef}
              value={query}
              onChange={handleChange}
              placeholder={t("adminPage.searchUsers")}
              className="h-8 w-48 text-sm"
              onKeyDown={(e) => e.key === "Escape" && handleClearSearch()}
            />
            <Button variant="ghost" size="icon" className="size-8" onClick={handleClearSearch}>
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="icon" className="size-8" onClick={handleOpenSearch}>
            <Search className="size-4" />
          </Button>
        )}
        <AddUserDialog>
          <Button size="icon" variant="ghost" className="size-8">
            <Plus className="size-4" />
          </Button>
        </AddUserDialog>
      </div>
    </div>
  )
}

export { UserTableHeader }
