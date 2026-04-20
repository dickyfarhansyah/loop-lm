import { Info } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTasksSettings, useUpdateTasksSettings } from "../hooks/use-settings"
import { UnderDevelopmentAlert } from "@/components/under-development-alert"
import type { TasksSettings } from "../types/settings"

function TasksSettingsPage() {
    const { t } = useTranslation()
    const { data: tasksSettings, isLoading } = useTasksSettings()
    const updateTasks = useUpdateTasksSettings()

    const [localTasksSettings, setLocalTasksSettings] = React.useState<Partial<TasksSettings>>({})

    React.useEffect(() => {
        if (tasksSettings) {
            setLocalTasksSettings(tasksSettings)
        }
    }, [tasksSettings])

    const handleChange = <K extends keyof TasksSettings>(key: K, value: TasksSettings[K]) => {
        setLocalTasksSettings((prev) => ({ ...prev, [key]: value }))
    }

    const handleSave = async () => {
        try {
            await updateTasks.mutateAsync(localTasksSettings)
            toast.success(t("settingsPage.tasksSavedSuccess"))
        } catch {
            toast.error(t("settingsPage.tasksSaveFailed"))
        }
    }

    if (isLoading) {
        return <div className="p-4">{t("settingsPage.loading")}</div>
    }

    return (
        <div className="space-y-8 w-full">

            <UnderDevelopmentAlert />

            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Label>{t("settingsPage.taskModelLabel")}</Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="size-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t("settingsPage.taskModelTooltip")}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>{t("settingsPage.taskTitleGeneration")}</Label>
                    <Switch
                        checked={localTasksSettings.title_generation ?? true}
                        onCheckedChange={(v) => handleChange("title_generation", v)}
                    />
                </div>
                <div>
                    <Label className="text-sm text-muted-foreground">{t("settingsPage.taskTitleGenerationPrompt")}</Label>
                    <Textarea
                        placeholder={t("settingsPage.taskPromptPlaceholder")}
                        value={localTasksSettings.title_generation_prompt || ""}
                        onChange={(e) => handleChange("title_generation_prompt", e.target.value)}
                        className="mt-1 min-h-15"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>{t("settingsPage.taskVoiceMode")}</Label>
                    <Switch
                        checked={localTasksSettings.voice_mode_custom_prompt ?? true}
                        onCheckedChange={(v) => handleChange("voice_mode_custom_prompt", v)}
                    />
                </div>
                <div>
                    <Label className="text-sm text-muted-foreground">{t("settingsPage.taskVoiceModePrompt")}</Label>
                    <Textarea
                        placeholder={t("settingsPage.taskPromptPlaceholder")}
                        value={localTasksSettings.voice_mode_prompt || ""}
                        onChange={(e) => handleChange("voice_mode_prompt", e.target.value)}
                        className="mt-1 min-h-15"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>{t("settingsPage.taskFollowUp")}</Label>
                    <Switch
                        checked={localTasksSettings.follow_up_generation ?? true}
                        onCheckedChange={(v) => handleChange("follow_up_generation", v)}
                    />
                </div>
                <div>
                    <Label className="text-sm text-muted-foreground">{t("settingsPage.taskFollowUpPrompt")}</Label>
                    <Textarea
                        placeholder={t("settingsPage.taskPromptPlaceholder")}
                        value={localTasksSettings.follow_up_generation_prompt || ""}
                        onChange={(e) => handleChange("follow_up_generation_prompt", e.target.value)}
                        className="mt-1 min-h-15"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>{t("settingsPage.taskTagsGeneration")}</Label>
                    <Switch
                        checked={localTasksSettings.tags_generation ?? true}
                        onCheckedChange={(v) => handleChange("tags_generation", v)}
                    />
                </div>
                <div>
                    <Label className="text-sm text-muted-foreground">{t("settingsPage.taskTagsGenerationPrompt")}</Label>
                    <Textarea
                        placeholder={t("settingsPage.taskPromptPlaceholder")}
                        value={localTasksSettings.tags_generation_prompt || ""}
                        onChange={(e) => handleChange("tags_generation_prompt", e.target.value)}
                        className="mt-1 min-h-15"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>{t("settingsPage.taskRetrievalQuery")}</Label>
                    <Switch
                        checked={localTasksSettings.retrieval_query_generation ?? true}
                        onCheckedChange={(v) => handleChange("retrieval_query_generation", v)}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label>{t("settingsPage.taskWebSearchQuery")}</Label>
                    <Switch
                        checked={localTasksSettings.web_search_query_generation ?? true}
                        onCheckedChange={(v) => handleChange("web_search_query_generation", v)}
                    />
                </div>
                <div>
                    <Label className="text-sm text-muted-foreground">{t("settingsPage.taskQueryGenerationPrompt")}</Label>
                    <Textarea
                        placeholder={t("settingsPage.taskPromptPlaceholder")}
                        value={localTasksSettings.query_generation_prompt || ""}
                        onChange={(e) => handleChange("query_generation_prompt", e.target.value)}
                        className="mt-1 min-h-15"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>{t("settingsPage.taskAutocomplete")}</Label>
                    <Switch
                        checked={localTasksSettings.autocomplete_generation ?? false}
                        onCheckedChange={(v) => handleChange("autocomplete_generation", v)}
                    />
                </div>
                <div>
                    <Label className="text-sm text-muted-foreground">{t("settingsPage.taskImagePromptGenerationPrompt")}</Label>
                    <Textarea
                        placeholder={t("settingsPage.taskPromptPlaceholder")}
                        value={localTasksSettings.image_prompt_generation_prompt || ""}
                        onChange={(e) => handleChange("image_prompt_generation_prompt", e.target.value)}
                        className="mt-1 min-h-15"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <div>
                    <Label className="text-sm text-muted-foreground">{t("settingsPage.taskToolsFunctionCallingPrompt")}</Label>
                    <Textarea
                        placeholder={t("settingsPage.taskPromptPlaceholder")}
                        value={localTasksSettings.tools_function_calling_prompt || ""}
                        onChange={(e) => handleChange("tools_function_calling_prompt", e.target.value)}
                        className="mt-1 min-h-15"
                    />
                </div>
            </div>

            <div className="h-16" />

            <div className="fixed bottom-0 right-0 p-4 md:p-6 bg-background/80 backdrop-blur-sm border-t md:border-t-0">
                <Button
                    onClick={handleSave}
                    disabled={updateTasks.isPending}
                    className="rounded-full px-6"
                >
                    {updateTasks.isPending ? t("settingsPage.savingBtn") : t("settingsPage.saveBtn")}
                </Button>
            </div>
        </div>
    )
}

export { TasksSettingsPage }
