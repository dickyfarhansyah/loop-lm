import { Search, X } from "lucide-react"
import { useTranslation } from "react-i18next"

interface ChatSearchBarProps {
    query: string
    resultCount: number
    onQueryChange: (q: string) => void
    onClose: () => void
}

function ChatSearchBar({ query, resultCount, onQueryChange, onClose }: ChatSearchBarProps) {
    const { t } = useTranslation()
    const handleClose = () => {
        onQueryChange("")
        onClose()
    }

    return (
        <div className="shrink-0 px-4 py-2 border-b bg-background">
            <div className="max-w-5xl mx-auto relative flex items-center gap-2">
                <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
                <input
                    autoFocus
                    type="text"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    placeholder={t("chatPage.searchPlaceholder")}
                    className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border bg-muted/50 outline-none focus:ring-2 focus:ring-primary"
                />
                {query && (
                    <span className="absolute right-10 text-xs text-muted-foreground">
                        {t("chatPage.searchResults", { count: resultCount })}
                    </span>
                )}
                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute right-3 text-muted-foreground hover:text-foreground"
                >
                    <X className="size-4" />
                </button>
            </div>
        </div>
    )
}

export { ChatSearchBar }
