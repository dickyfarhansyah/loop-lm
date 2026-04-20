import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
    CheckCircle2,
    ChevronLeft,
    Circle,
    Copy,
    Edit,
    Loader2,
    MoreVertical,
    Plus,
    Star,
    Trash2,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"

import { modelApi } from "@/api"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

function SystemPromptListPage() {
    const { t } = useTranslation()
    const { modelId } = useParams<{ modelId: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [deletePromptId, setDeletePromptId] = useState<string | null>(null)

    const { data: prompts, isLoading } = useQuery({
        queryKey: ["modelPrompts", modelId],
        queryFn: async () => {
            if (!modelId) return []
            return await modelApi.getModelPrompts(modelId)
        },
        enabled: !!modelId,
    })

    const deleteMutation = useMutation({
        mutationFn: async (promptId: string) => {
            await modelApi.deleteModelPrompt(promptId)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["modelPrompts", modelId] })
            toast.success(t("systemPromptList.deleteSuccess"))
            setDeletePromptId(null)
        },
        onError: () => {
            toast.error(t("systemPromptList.deleteError"))
        },
    })

    const setDefaultMutation = useMutation({
        mutationFn: async (promptId: string) => {
            await modelApi.setDefaultPrompt(promptId)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["modelPrompts", modelId] })
            toast.success(t("systemPromptList.setDefaultSuccess"))
        },
        onError: () => {
            toast.error(t("systemPromptList.setDefaultError"))
        },
    })

    const toggleEnabledMutation = useMutation({
        mutationFn: async ({ promptId, enabled }: { promptId: string; enabled: boolean }) => {
            await modelApi.updateModelPrompt(promptId, { enabled })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["modelPrompts", modelId] })
            queryClient.invalidateQueries({ queryKey: ["modelPromptsSummary"] })
        },
        onError: () => {
            toast.error(t("systemPromptList.updateError"))
        },
    })

    const duplicateMutation = useMutation({
        mutationFn: async (prompt: any) => {
            if (!modelId) return
            await modelApi.createModelPrompt(modelId, {
                name: `${prompt.name} (Copy)`,
                prompt: prompt.prompt,
                enabled: false,
                isDefault: false,
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["modelPrompts", modelId] })
            toast.success(t("systemPromptList.duplicateSuccess"))
        },
        onError: () => {
            toast.error(t("systemPromptList.duplicateError"))
        },
    })

    const handleBack = () => {
        navigate("/admin/settings/system-prompts")
    }

    const handleCreate = () => {
        navigate(`/admin/settings/system-prompts/${encodeURIComponent(modelId!)}/new`)
    }

    const handleEdit = (promptId: string) => {
        navigate(`/admin/settings/system-prompts/${encodeURIComponent(modelId!)}/edit/${promptId}`)
    }

    const handleDelete = (promptId: string) => {
        setDeletePromptId(promptId)
    }

    const handleSetDefault = (promptId: string) => {
        setDefaultMutation.mutate(promptId)
    }

    const handleToggleEnabled = (promptId: string, enabled: boolean) => {
        toggleEnabledMutation.mutate({ promptId, enabled })
    }

    const handleDuplicate = (prompt: any) => {
        duplicateMutation.mutate(prompt)
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

            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={handleBack}>
                    <ChevronLeft className="size-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-semibold mb-1">
                        {t("systemPromptList.title")}
                    </h1>

                </div>
                <Button onClick={handleCreate}>
                    <Plus className="size-4 mr-2" />
                    {t("systemPromptList.addNew")}
                </Button>
            </div>

            {prompts && prompts.length > 0 ? (
                <div className="space-y-3">
                    {prompts.map((prompt) => (
                        <Card key={prompt.id}>
                            <CardContent className="px-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="  truncate">
                                                {prompt.name}
                                            </h3>
                                            {prompt.isDefault && (
                                                <Badge variant="default">

                                                    {t("systemPromptList.default")}
                                                </Badge>
                                            )}
                                            {prompt.enabled ? (
                                                <Badge variant="default" className="bg-green-600">
                                                    <CheckCircle2 className="size-3 mr-1" />
                                                    {t("systemPromptList.active")}
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    <Circle className="size-3 mr-1" />
                                                    {t("systemPromptList.inactive")}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {t("systemPromptList.updated")}{" "}
                                            {new Date(prompt.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(prompt.id)}
                                            title={t("systemPromptList.edit")}
                                        >
                                            <Edit className="size-4" />
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {!prompt.isDefault && (
                                                    <>
                                                        <DropdownMenuItem
                                                            onClick={() => handleSetDefault(prompt.id)}
                                                        >
                                                            <Star className="size-4 mr-2" />
                                                            {t("systemPromptList.setAsDefault")}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                    </>
                                                )}
                                                <DropdownMenuItem
                                                    onClick={() => handleDuplicate(prompt)}
                                                >
                                                    <Copy className="size-4 mr-2" />
                                                    {t("systemPromptList.duplicate")}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(prompt.id)}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="size-4 mr-2" />
                                                    {t("systemPromptList.delete")}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        <Switch
                                            checked={prompt.enabled}
                                            onCheckedChange={(enabled) => handleToggleEnabled(prompt.id, enabled)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <p className="text-muted-foreground mb-4">
                            {t("systemPromptList.noPrompts")}
                        </p>
                        <Button onClick={handleCreate}>
                            <Plus className="size-4 mr-2" />
                            {t("systemPromptList.createFirst")}
                        </Button>
                    </CardContent>
                </Card>
            )}

            <AlertDialog open={!!deletePromptId} onOpenChange={() => setDeletePromptId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("systemPromptList.deleteTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("systemPromptList.deleteDescription")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("systemPromptList.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deletePromptId && deleteMutation.mutate(deletePromptId)}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {t("systemPromptList.delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export { SystemPromptListPage }
