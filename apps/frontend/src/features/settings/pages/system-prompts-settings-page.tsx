import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { Loader2, Search, Edit, CheckCircle2, Circle } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAvailableModels } from "../hooks"
import { modelApi } from "@/api"
import staticLogogram from "@/assets/images/logogram.png"
import { useAppLogo } from "@/hooks/use-app-logo"

function SystemPromptsSettingsPage() {
    const { t } = useTranslation()
    const [searchQuery, setSearchQuery] = useState("")
    const navigate = useNavigate()
    const { logogram: uploadedLogogram } = useAppLogo()
    const logogram = uploadedLogogram || staticLogogram


    const { data: modelSystemPrompts = {} } = useQuery({
        queryKey: ["modelPromptsSummary"],
        queryFn: () => modelApi.getModelPromptsSummary(),
    })

    const { data, isLoading } = useAvailableModels()
    const models = data?.data ?? []

    const filteredModels = models.filter(
        (model) =>
            model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            model.owned_by.toLowerCase().includes(searchQuery.toLowerCase()) ||
            model.connection.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleEditPrompt = (modelId: string) => {
        navigate(`/admin/settings/system-prompts/${encodeURIComponent(modelId)}`)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div>

            <div className="mb-6">
                <h1 className="text-2xl font-semibold mb-2">{t("systemPromptsList.title")}</h1>
            </div>


            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                    placeholder={t("systemPromptsList.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>


            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-400px)]">
                {filteredModels.map((model) => {
                    const promptConfig = modelSystemPrompts[model.id]
                    const hasPrompt = promptConfig?.hasPrompt || false
                    const isEnabled = promptConfig?.enabled || false

                    return (
                        <div
                            key={model.id}
                            className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                            onClick={() => handleEditPrompt(model.id)}
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">

                                <img
                                    src={logogram}
                                    alt="Logo"
                                    className="size-10 rounded-full shrink-0"
                                />


                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium truncate">{model.id}</p>
                                        {hasPrompt && (
                                            <Badge variant={isEnabled ? "default" : "secondary"} className="shrink-0">
                                                {isEnabled ? (
                                                    <>
                                                        <CheckCircle2 className="size-3 mr-1" />
                                                        {t("systemPromptsList.statusActive")}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Circle className="size-3 mr-1" />
                                                        {t("systemPromptsList.statusInactive")}
                                                    </>
                                                )}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {model.connection} · {model.owned_by}
                                    </p>


                                </div>
                            </div>


                            <Button
                                variant={hasPrompt ? "outline" : "default"}
                                size="sm"
                                className="shrink-0 ml-2"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditPrompt(model.id)
                                }}
                            >
                                <Edit className="size-4 mr-2" />
                                {hasPrompt ? t("systemPromptsList.edit") : t("systemPromptsList.setup")}
                            </Button>
                        </div>
                    )
                })}

                {filteredModels.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        {searchQuery
                            ? t("systemPromptsList.noResults", { query: searchQuery })
                            : t("systemPromptsList.noModels")}
                    </div>
                )}
            </div>
        </div>
    )
}

export { SystemPromptsSettingsPage }
