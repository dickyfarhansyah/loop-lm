import { Plus, Search } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface NotesHeaderProps {
  totalNotes: number
  searchQuery: string
  onSearchChange: (query: string) => void
  filterType: string
  onFilterTypeChange: (type: string) => void
  filterCategory: string
  onFilterCategoryChange: (category: string) => void
  viewMode: string
  onViewModeChange: (mode: string) => void
  onNewNote: () => void
}

function NotesHeader({
  totalNotes,
  searchQuery,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterCategory,
  onFilterCategoryChange,
  viewMode,
  onViewModeChange,
  onNewNote,
}: NotesHeaderProps) {
  const { t } = useTranslation()
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {t("notesPage.title")} <span className="text-muted-foreground font-normal">{totalNotes}</span>
        </h1>
        <Button onClick={onNewNote} className="gap-2">
          <Plus className="size-4" />
          {t("notesPage.newNote")}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={t("notesPage.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={onFilterTypeChange}>
            <SelectTrigger className="w-20 border-0 shadow-none">
              <SelectValue placeholder={t("notesPage.filterAll")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("notesPage.filterAll")}</SelectItem>
              <SelectItem value="personal">{t("notesPage.filterPersonal")}</SelectItem>
              <SelectItem value="work">{t("notesPage.filterWork")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={onFilterCategoryChange}>
            <SelectTrigger className="w-24 border-0 shadow-none">
              <SelectValue placeholder={t("notesPage.filterWrite")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="write">{t("notesPage.filterWrite")}</SelectItem>
              <SelectItem value="read">{t("notesPage.filterRead")}</SelectItem>
              <SelectItem value="archive">{t("notesPage.filterArchive")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Select value={viewMode} onValueChange={onViewModeChange}>
          <SelectTrigger className="w-20 border-0 shadow-none">
            <SelectValue placeholder={t("notesPage.viewGrid")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">{t("notesPage.viewGrid")}</SelectItem>
            <SelectItem value="list">{t("notesPage.viewList")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div >
  )
}

export { NotesHeader }
