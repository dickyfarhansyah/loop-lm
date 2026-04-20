import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm, useWatch } from "react-hook-form"
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
    ChevronLeft,
    Loader2,
    Sparkles,
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
    FormDescription,
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
import { toast } from "sonner"

const createPromptFormSchema = (t: (key: string) => string) =>
    z.object({
        name: z.string().min(1, t("systemPromptEdit.validationNameEmpty")).max(100),
        prompt: z.string().min(1, t("systemPromptEdit.validationEmpty")).max(10000),
        enabled: z.boolean().default(true),
        isDefault: z.boolean().default(false),
    })

type PromptFormData = {
    name: string
    prompt: string
    enabled: boolean
    isDefault: boolean
}

function SystemPromptEditFormPage() {
    const { t } = useTranslation()
    const { modelId, promptId } = useParams<{ modelId: string; promptId: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [showResetDialog, setShowResetDialog] = useState(false)
    const [showPreview, setShowPreview] = useState(false)

    const isNewPrompt = !promptId

    
    const promptFormSchema = createPromptFormSchema(t)

    
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

    
    const { data: promptData, isLoading: isLoadingPrompt } = useQuery({
        queryKey: ["modelPrompt", promptId],
        queryFn: async () => {
            if (!promptId) return null
            return await modelApi.getModelPromptById(promptId)
        },
        enabled: !!promptId,
    })

    
    const form = useForm<PromptFormData>({
        
        resolver: zodResolver(promptFormSchema),
        defaultValues: {
            name: promptData?.name || "",
            prompt: promptData?.prompt || "",
            enabled: promptData?.enabled ?? true,
            isDefault: promptData?.isDefault ?? false,
        },
        values: promptData
            ? {
                name: promptData.name || "",
                prompt: promptData.prompt || "",
                enabled: promptData.enabled ?? true,
                isDefault: promptData.isDefault ?? false,
            }
            : undefined,
    })

    
    const saveMutation = useMutation({
        mutationFn: async (data: PromptFormData) => {
            if (!modelId) throw new Error("Model ID is required")

            if (isNewPrompt) {
                return await modelApi.createModelPrompt(modelId, data)
            } else {
                if (!promptId) throw new Error("Prompt ID is required")
                return await modelApi.updateModelPrompt(promptId, data)
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["modelPrompts", modelId] })
            queryClient.invalidateQueries({ queryKey: ["modelPrompt", promptId] })
            toast.success(
                isNewPrompt
                    ? t("systemPromptEdit.createSuccess")
                    : t("systemPromptEdit.saveSuccess")
            )
            navigate(`/admin/settings/system-prompts/${encodeURIComponent(modelId!)}`)
        },
        onError: () => {
            toast.error(
                isNewPrompt
                    ? t("systemPromptEdit.createError")
                    : t("systemPromptEdit.saveError")
            )
        },
    })

    const onSubmit = (data: PromptFormData) => {
        saveMutation.mutate(data)
    }

    const handleBack = () => {
        navigate(`/admin/settings/system-prompts/${encodeURIComponent(modelId!)}`)
    }

    const handleResetClick = () => {
        setShowResetDialog(true)
    }

    const handleResetConfirm = () => {
        form.reset({
            name: "",
            prompt: "",
            enabled: true,
            isDefault: false,
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
                        form.setValue("name", data.name || "", { shouldDirty: true })
                        form.setValue("prompt", data.prompt || "", { shouldDirty: true })
                        form.setValue("enabled", data.enabled ?? true, { shouldDirty: true })
                        form.setValue("isDefault", data.isDefault ?? false, { shouldDirty: true })
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
    const charCount = watchedPrompt?.length || 0
    const wordCount = watchedPrompt?.trim().split(/\s+/).filter(Boolean).length || 0
    const isDirty = form.formState.isDirty

    if (isLoadingPrompt && !isNewPrompt) {
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
                        {isNewPrompt
                            ? t("systemPromptEdit.titleNew")
                            : t("systemPromptEdit.titleEdit")}
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t("systemPromptEdit.nameLabel")}</CardTitle>
                                    <CardDescription>
                                        {t("systemPromptEdit.nameDescription")}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        placeholder={t("systemPromptEdit.namePlaceholder")}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>{t("systemPromptEdit.promptLabel")}</CardTitle>
                                            <CardDescription>
                                                {t("systemPromptEdit.promptDescription")}
                                            </CardDescription>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowPreview(!showPreview)}
                                        >
                                            {showPreview ? (
                                                <>
                                                    <EyeOff className="size-4 mr-2" />
                                                    {t("systemPromptEdit.hidePreview")}
                                                </>
                                            ) : (
                                                <>
                                                    <Eye className="size-4 mr-2" />
                                                    {t("systemPromptEdit.showPreview")}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name="prompt"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    {showPreview ? (
                                                        <div className="min-h-75 p-4 rounded-md border bg-muted/50 whitespace-pre-wrap">
                                                            {field.value || t("systemPromptEdit.emptyPrompt")}
                                                        </div>
                                                    ) : (
                                                        <Textarea
                                                            placeholder={t("systemPromptEdit.promptPlaceholder")}
                                                            className="min-h-75 font-mono text-sm"
                                                            {...field}
                                                        />
                                                    )}
                                                </FormControl>
                                                <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                                                    <span>
                                                        {charCount} {t("systemPromptEdit.characters")} · {wordCount}{" "}
                                                        {t("systemPromptEdit.words")}
                                                    </span>
                                                    <span>
                                                        {charCount}/10000
                                                    </span>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t("systemPromptEdit.settingsLabel")}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="enabled"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between">
                                                <div>
                                                    <FormLabel>{t("systemPromptEdit.enabledLabel")}</FormLabel>
                                                    <FormDescription>
                                                        {t("systemPromptEdit.enabledDescription")}
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="isDefault"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between">
                                                <div>
                                                    <FormLabel>{t("systemPromptEdit.defaultLabel")}</FormLabel>
                                                    <FormDescription>
                                                        {t("systemPromptEdit.defaultDescription")}
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            
                            <div className="flex items-center gap-3">
                                <Button
                                    type="submit"
                                    disabled={saveMutation.isPending || !isDirty}
                                    className="flex-1"
                                >
                                    {saveMutation.isPending ? (
                                        <Loader2 className="size-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="size-4 mr-2" />
                                    )}
                                    {isNewPrompt ? t("systemPromptEdit.create") : t("systemPromptEdit.save")}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleResetClick}
                                    disabled={saveMutation.isPending}
                                >
                                    <RotateCcw className="size-4 mr-2" />
                                    {t("systemPromptEdit.reset")}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>

                
                <div className="space-y-6">
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="size-4" />
                                {t("systemPromptEdit.templatesTitle")}
                            </CardTitle>
                            <CardDescription>{t("systemPromptEdit.templatesDescription")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Select onValueChange={handleLoadTemplate}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("systemPromptEdit.selectTemplate")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {SYSTEM_PROMPT_TEMPLATES.map((template) => (
                                        <SelectItem key={template.id} value={template.id}>
                                            {template.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("systemPromptEdit.variablesTitle")}</CardTitle>
                            <CardDescription>{t("systemPromptEdit.variablesDescription")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {AVAILABLE_VARIABLES.map((variable) => (
                                    <Button
                                        key={variable.key}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-start text-xs"
                                        onClick={() => insertVariable(variable.key)}
                                    >
                                        <code className="flex-1 text-left">{variable.key}</code>
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("systemPromptEdit.actionsTitle")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={handleCopy}
                            >
                                <Copy className="size-4 mr-2" />
                                {t("systemPromptEdit.copy")}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={handleExport}
                            >
                                <Download className="size-4 mr-2" />
                                {t("systemPromptEdit.export")}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={handleImport}
                            >
                                <Upload className="size-4 mr-2" />
                                {t("systemPromptEdit.import")}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            
            <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("systemPromptEdit.resetTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("systemPromptEdit.resetDescription")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("systemPromptEdit.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetConfirm}>
                            {t("systemPromptEdit.confirm")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export { SystemPromptEditFormPage }
