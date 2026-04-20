import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm, useWatch, type ControllerRenderProps } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import * as z from "zod"
import { modelApi } from "@/api"
import {
    Save,
    RotateCcw,
    Eye,
    EyeOff,
    Copy,
    Download,
    Upload,
    Sparkles,
    Info,
    ChevronLeft,
    Loader2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { useAvailableModels } from "../hooks"
import { toast } from "sonner"
import staticLogogram from "@/assets/images/logogram.png"
import { useAppLogo } from "@/hooks/use-app-logo"

function SystemPromptEditPage() {
    const { t } = useTranslation()
    const { modelId } = useParams<{ modelId: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [showResetDialog, setShowResetDialog] = useState(false)
    const { logogram: uploadedLogogram } = useAppLogo()
    const logogram = uploadedLogogram || staticLogogram


    const SYSTEM_PROMPT_TEMPLATES = [
        {
            id: "default",
            name: t("systemPromptEdit.templateDefaultName"),
            description: t("systemPromptEdit.templateDefaultDesc"),
            prompt: "You are a helpful AI assistant. Provide clear, accurate, and concise responses.",
        },
        {
            id: "customer-service",
            name: t("systemPromptEdit.templateCustomerServiceName"),
            description: t("systemPromptEdit.templateCustomerServiceDesc"),
            prompt: `You are a friendly and professional customer service representative. Your role is to:
- Help customers with their questions and concerns
- Be empathetic and understanding
- Provide clear solutions and alternatives
- Maintain a positive and helpful tone
- Ask clarifying questions when needed`,
        },
        {
            id: "technical-expert",
            name: t("systemPromptEdit.templateTechnicalName"),
            description: t("systemPromptEdit.templateTechnicalDesc"),
            prompt: `You are a technical expert providing detailed technical support. Your role is to:
- Provide accurate technical information
- Explain complex concepts clearly
- Offer step-by-step solutions
- Include relevant code examples when appropriate
- Ask for system details when troubleshooting`,
        },
        {
            id: "creative-writer",
            name: t("systemPromptEdit.templateCreativeName"),
            description: t("systemPromptEdit.templateCreativeDesc"),
            prompt: `You are a creative writer with expertise in crafting engaging content. Your role is to:
- Write compelling and original content
- Adapt your writing style to the audience
- Use vivid language and storytelling techniques
- Maintain consistency in tone and voice
- Be creative while staying on topic`,
        },
        {
            id: "code-assistant",
            name: t("systemPromptEdit.templateCodeName"),
            description: t("systemPromptEdit.templateCodeDesc"),
            prompt: `You are an expert programming assistant. Your role is to:
- Help write, review, and debug code
- Explain programming concepts clearly
- Follow best practices and coding standards
- Provide secure and efficient solutions
- Include comments and documentation
- Suggest improvements and optimizations`,
        },
    ]


    const AVAILABLE_VARIABLES = [
        { key: "{{user_name}}", description: t("systemPromptEdit.variableUserName") },
        { key: "{{user_email}}", description: t("systemPromptEdit.variableUserEmail") },
        { key: "{{date}}", description: t("systemPromptEdit.variableDate") },
        { key: "{{time}}", description: t("systemPromptEdit.variableTime") },
        { key: "{{model_name}}", description: t("systemPromptEdit.variableModelName") },
        { key: "{{company_name}}", description: t("systemPromptEdit.variableCompanyName") },
    ]


    const systemPromptFormSchema = z.object({
        prompt: z
            .string()
            .min(1, t("systemPromptEdit.validationEmpty"))
            .max(10000, t("systemPromptEdit.validationTooLong")),
        name: z
            .string()
            .max(100, t("systemPromptEdit.validationNameTooLong"))
            .optional(),
        enabled: z.boolean().default(true),
    })


    const { data, isLoading } = useAvailableModels()
    const models = data?.data ?? []
    const currentModel = models.find((m) => m.id === modelId)


    const { data: systemPromptData, isLoading: isLoadingPrompt } = useQuery({
        queryKey: ["systemPrompt", modelId],
        queryFn: async () => {
            if (!modelId) return null
            return await modelApi.getSystemPrompt(modelId)
        },
        enabled: !!modelId,
    })

    type SystemPromptFormData = z.infer<typeof systemPromptFormSchema>


    const form = useForm<SystemPromptFormData>({
        resolver: zodResolver(systemPromptFormSchema),
        defaultValues: {
            prompt: systemPromptData?.prompt || "",
            name: systemPromptData?.name || "",
            enabled: systemPromptData?.enabled ?? true,
        },
        values: systemPromptData
            ? {
                prompt: systemPromptData.prompt || "",
                name: systemPromptData.name || "",
                enabled: systemPromptData.enabled ?? true,
            }
            : undefined,
    })


    const saveMutation = useMutation({
        mutationFn: async (data: SystemPromptFormData) => {
            if (!modelId) throw new Error("Model ID is required")
            return await modelApi.updateSystemPrompt(modelId, data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["systemPrompt", modelId] })
            form.reset(form.getValues())
            toast.success(t("systemPromptEdit.saveSuccess"))
        },
        onError: () => {
            toast.error(t("systemPromptEdit.saveError"))
        },
    })

    const onSubmit = (data: SystemPromptFormData) => {
        saveMutation.mutate(data)
    }

    const handleResetClick = () => {
        setShowResetDialog(true)
    }

    const handleResetConfirm = () => {
        form.reset({
            prompt: "",
            name: "",
            enabled: true,
        })
        setShowResetDialog(false)
        toast.success(t("systemPromptEdit.resetSuccess"))
    }

    const handleLoadTemplate = (templateId: string) => {
        const template = SYSTEM_PROMPT_TEMPLATES.find((t) => t.id === templateId)
        if (template) {
            form.setValue("prompt", template.prompt, { shouldDirty: true })
            form.setValue("name", template.name, { shouldDirty: true })
            toast.success(t("systemPromptEdit.templateLoaded", { name: template.name }))
        }
    }

    const handleCopy = () => {
        const prompt = form.getValues("prompt")
        navigator.clipboard.writeText(prompt)
        toast.success(t("systemPromptEdit.copySuccess"))
    }

    const handleExport = () => {
        const formData = form.getValues()
        const data = {
            modelId,
            ...formData,
            exportedAt: new Date().toISOString(),
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `system-prompt-${modelId}-${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
        toast.success(t("systemPromptEdit.exportSuccess"))
    }

    const handleImport = () => {
        const input = document.createElement("input")
        input.type = "file"
        input.accept = ".json"
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
                const reader = new FileReader()
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target?.result as string)
                        form.setValue("prompt", data.prompt || "", { shouldDirty: true })
                        form.setValue("name", data.name || "", { shouldDirty: true })
                        form.setValue("enabled", data.enabled ?? true, { shouldDirty: true })
                        toast.success(t("systemPromptEdit.importSuccess"))
                    } catch {
                        toast.error(t("systemPromptEdit.importError"))
                    }
                }
                reader.readAsText(file)
            }
        }
        input.click()
    }

    const insertVariable = (variable: string) => {
        const currentPrompt = form.getValues("prompt")
        form.setValue("prompt", currentPrompt + variable, { shouldDirty: true })
    }

    const watchedPrompt = useWatch({ control: form.control, name: "prompt" })
    const watchedEnabled = useWatch({ control: form.control, name: "enabled" })
    const charCount = watchedPrompt?.length || 0
    const wordCount = watchedPrompt?.trim().split(/\s+/).filter(Boolean).length || 0
    const isDirty = form.formState.isDirty

    if (isLoading || isLoadingPrompt) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!currentModel) {
        return (
            <div className="p-6">
                <div className="mb-4 p-4 border border-destructive bg-destructive/10 rounded-lg">
                    <h3 className="font-semibold mb-1">{t("systemPromptEdit.modelNotFound")}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t("systemPromptEdit.modelNotFoundDesc", { modelId })}
                    </p>
                </div>
                <Button
                    onClick={() => navigate("/admin/settings/system-prompts")}
                    className="mt-4"
                >
                    <ChevronLeft className="size-4 mr-2" />
                    {t("systemPromptEdit.backToList")}
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/admin/settings/system-prompts")}
                    >
                        <ChevronLeft className="size-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <img
                            src={logogram}
                            alt="Model Icon"
                            className="size-10 rounded-full"
                        />
                        <div>
                            <h1 className="text-2xl font-semibold">{t("systemPromptEdit.title")}</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {t("systemPromptEdit.modelLabel")}{" "}
                                <span className="font-medium text-foreground">
                                    {currentModel.id}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleResetClick} disabled={saveMutation.isPending}>
                        <RotateCcw className="size-4 mr-2" />
                        {t("systemPromptEdit.reset")}
                    </Button>
                    <Button
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={saveMutation.isPending || !isDirty}
                    >
                        {saveMutation.isPending ? (
                            <>
                                <Loader2 className="size-4 mr-2 animate-spin" />
                                {t("systemPromptEdit.saving")}
                            </>
                        ) : (
                            <>
                                <Save className="size-4 mr-2" />
                                {t("systemPromptEdit.save")}
                            </>
                        )}
                    </Button>
                </div>
            </div>


            {!watchedEnabled && (
                <div className="flex items-start gap-3 p-4 border border-blue-500/50 bg-blue-500/10 rounded-lg">
                    <Info className="size-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold mb-1">{t("systemPromptEdit.promptDisabledTitle")}</h3>
                        <p className="text-sm text-muted-foreground">
                            {t("systemPromptEdit.promptDisabledDesc")}
                        </p>
                    </div>
                </div>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>{t("systemPromptEdit.systemPromptTitle")}</CardTitle>
                                        <CardDescription>
                                            {t("systemPromptEdit.systemPromptDesc")}
                                        </CardDescription>
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="enabled"
                                        render={({ field }: { field: ControllerRenderProps<SystemPromptFormData, "enabled"> }) => (
                                            <FormItem className="flex items-center gap-2 space-y-0">
                                                <FormLabel className="text-sm text-muted-foreground">
                                                    {t("systemPromptEdit.enabled")}
                                                </FormLabel>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">

                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }: { field: ControllerRenderProps<SystemPromptFormData, "name"> }) => (
                                        <FormItem>
                                            <FormLabel>{t("systemPromptEdit.promptName")}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder={t("systemPromptEdit.promptNamePlaceholder")}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />


                                <FormField
                                    control={form.control}
                                    name="prompt"
                                    render={({ field }: { field: ControllerRenderProps<SystemPromptFormData, "prompt"> }) => (
                                        <FormItem>
                                            <Tabs defaultValue="editor" className="w-full">
                                                <TabsList className="grid w-full grid-cols-2">
                                                    <TabsTrigger value="editor">
                                                        <EyeOff className="size-4 mr-2" />
                                                        {t("systemPromptEdit.editor")}
                                                    </TabsTrigger>
                                                    <TabsTrigger value="preview">
                                                        <Eye className="size-4 mr-2" />
                                                        {t("systemPromptEdit.preview")}
                                                    </TabsTrigger>
                                                </TabsList>

                                                <TabsContent value="editor" className="space-y-2">
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder={t("systemPromptEdit.promptPlaceholder")}
                                                            {...field}
                                                            className="min-h-96 font-mono text-sm"
                                                        />
                                                    </FormControl>
                                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                        <span>
                                                            {t("systemPromptEdit.charCount", { count: charCount })} · {t("systemPromptEdit.wordCount", { count: wordCount })}
                                                        </span>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={handleCopy}
                                                                className="h-7"
                                                            >
                                                                <Copy className="size-3 mr-1" />
                                                                {t("systemPromptEdit.copy")}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </TabsContent>

                                                <TabsContent value="preview" className="space-y-2">
                                                    <div className="min-h-96 p-4 border rounded-md bg-muted/30">
                                                        {field.value ? (
                                                            <pre className="whitespace-pre-wrap font-mono text-sm">
                                                                {field.value}
                                                            </pre>
                                                        ) : (
                                                            <p className="text-muted-foreground text-sm">
                                                                {t("systemPromptEdit.noPromptYet")}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TabsContent>
                                            </Tabs>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>


                    <div className="space-y-4">

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Sparkles className="size-4" />
                                    {t("systemPromptEdit.templatesTitle")}
                                </CardTitle>
                                <CardDescription>{t("systemPromptEdit.templatesDesc")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Select onValueChange={handleLoadTemplate}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("systemPromptEdit.selectTemplate")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SYSTEM_PROMPT_TEMPLATES.map((template) => (
                                            <SelectItem key={template.id} value={template.id}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{template.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {template.description}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>


                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">{t("systemPromptEdit.variablesTitle")}</CardTitle>
                                <CardDescription>
                                    {t("systemPromptEdit.variablesDesc")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                {AVAILABLE_VARIABLES.map((variable) => (
                                    <button
                                        key={variable.key}
                                        onClick={() => insertVariable(variable.key)}
                                        className="w-full text-left p-2 rounded-md hover:bg-accent transition-colors group"
                                    >
                                        <code className="text-xs font-mono text-primary">
                                            {variable.key}
                                        </code>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {variable.description}
                                        </p>
                                    </button>
                                ))}
                            </CardContent>
                        </Card>


                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">{t("systemPromptEdit.actionsTitle")}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={handleExport}
                                >
                                    <Download className="size-4 mr-2" />
                                    {t("systemPromptEdit.exportJson")}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={handleImport}
                                >
                                    <Upload className="size-4 mr-2" />
                                    {t("systemPromptEdit.importJson")}
                                </Button>
                            </CardContent>
                        </Card>


                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Info className="size-4" />
                                    {t("systemPromptEdit.tipsTitle")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="text-xs text-muted-foreground space-y-2">
                                    <li>• {t("systemPromptEdit.tip1")}</li>
                                    <li>• {t("systemPromptEdit.tip2")}</li>
                                    <li>• {t("systemPromptEdit.tip3")}</li>
                                    <li>• {t("systemPromptEdit.tip4")}</li>
                                    <li>• {t("systemPromptEdit.tip5")}</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </Form>


            <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("systemPromptEdit.resetDialogTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("systemPromptEdit.resetDialogDesc")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("systemPromptEdit.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetConfirm}>
                            {t("systemPromptEdit.confirmReset")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export { SystemPromptEditPage }
