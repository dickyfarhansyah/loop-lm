import * as React from "react"
import { Database, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { databaseApi } from "@/api/database.api"

interface ActionItem {
    key: string
    label: string
    action: () => Promise<void>
}

function DatabaseSettingsPage() {
    const { t } = useTranslation()
    const [loading, setLoading] = React.useState<string | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const run = async (key: string, fn: () => Promise<void>) => {
        setLoading(key)
        try {
            await fn()
        } catch {
            toast.error(t("settingsPage.dbOperationFailed"))
        } finally {
            setLoading(null)
        }
    }

    const handleImportConfig = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        e.target.value = ""
        await run("import-config", async () => {
            const result = await databaseApi.importConfig(file)
            toast.success(result?.message ?? t("settingsPage.dbImportConfigSuccess"))
        })
    }

    const actions: ActionItem[] = [
        {
            key: "import-config",
            label: t("settingsPage.dbImportConfig"),
            action: async () => fileInputRef.current?.click(),
        },
        {
            key: "export-config",
            label: t("settingsPage.dbExportConfig"),
            action: async () => {
                await databaseApi.exportConfig()
                toast.success(t("settingsPage.dbExportConfigSuccess"))
            },
        },
        {
            key: "download-db",
            label: t("settingsPage.dbDownload"),
            action: async () => {
                await databaseApi.downloadDatabase()
                toast.success(t("settingsPage.dbDownloadSuccess"))
            },
        },
        {
            key: "export-chats",
            label: t("settingsPage.dbExportChats"),
            action: async () => {
                await databaseApi.exportChats()
                toast.success(t("settingsPage.dbExportChatsSuccess"))
            },
        },
        {
            key: "export-users",
            label: t("settingsPage.dbExportUsers"),
            action: async () => {
                await databaseApi.exportUsers()
                toast.success(t("settingsPage.dbExportUsersSuccess"))
            },
        },
    ]

    return (
        <div className="w-full space-y-4">
            <div>
                <h2 className="text-base font-semibold">{t("settingsPage.databaseTitle")}</h2>
            </div>

            <Separator />

            <div className="flex flex-col gap-1">
                {actions.map(({ key, label, action }, index) => (
                    <React.Fragment key={key}>
                        <Button
                            variant="ghost"
                            className="justify-start gap-3 h-auto py-3 px-3 font-normal text-sm"
                            onClick={() => run(key, action)}
                            disabled={loading !== null}
                        >
                            {loading === key ? (
                                <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                            ) : (
                                <Database className="size-4 shrink-0 text-muted-foreground" />
                            )}
                            {label}
                        </Button>
                        {index < actions.length - 1 && <Separator />}
                    </React.Fragment>
                ))}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportConfig}
            />
        </div>
    )
}

export { DatabaseSettingsPage }


