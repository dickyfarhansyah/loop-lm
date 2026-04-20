import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm, useWatch, type ControllerRenderProps } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import * as z from "zod"
import {
    ChevronLeft,
    Save,
    Loader2,
    ChevronDown,
    ChevronUp,
    Plus,
    X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAvailableModels } from "../hooks"
import { modelApi } from "@/api"
import { toast } from "sonner"
import staticLogogram from "@/assets/images/logogram.png"
import { useAppLogo } from "@/hooks/use-app-logo"

const modelConfigSchema = z.object({
    description: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(100000).optional(),
    topP: z.number().min(0).max(1).optional(),
    frequencyPenalty: z.number().min(-2).max(2).optional(),
    presencePenalty: z.number().min(-2).max(2).optional(),
    capabilities: z.object({
        vision: z.boolean().default(false),
        fileUpload: z.boolean().default(false),
        fileContext: z.boolean().default(false),
        webSearch: z.boolean().default(false),
        imageGeneration: z.boolean().default(false),
        codeInterpreter: z.boolean().default(false),
        usage: z.boolean().default(false),
        citations: z.boolean().default(false),
        statusUpdates: z.boolean().default(false),
        builtinTools: z.boolean().default(false),
    }),
    defaultFeatures: z.object({
        webSearch: z.boolean().default(false),
        imageGeneration: z.boolean().default(false),
        codeInterpreter: z.boolean().default(false),
    }),
    ttsVoice: z.string().optional(),
    tags: z.array(z.string()).default([]),
})

type ModelConfigFormData = z.infer<typeof modelConfigSchema>

function ModelDetailPage() {
    const { modelId } = useParams<{ modelId: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { t } = useTranslation()
    const { logogram: uploadedLogogram } = useAppLogo()
    const logogram = uploadedLogogram || staticLogogram
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
    const [tagInput, setTagInput] = useState("")


    const { data, isLoading } = useAvailableModels()
    const models = data?.data ?? []
    const currentModel = models.find((m) => m.id === modelId)


    const { data: modelConfig, isLoading: isLoadingConfig } = useQuery({
        queryKey: ["modelConfig", modelId],
        queryFn: async () => {
            if (!modelId) return null
            return await modelApi.getModelConfig(modelId)
        },
        enabled: !!modelId,
    })


    const form = useForm<ModelConfigFormData>({
        resolver: zodResolver(modelConfigSchema),
    })


    useEffect(() => {
        if (modelConfig) {
            form.reset(modelConfig as any)
        }
    }, [modelConfig, form])


    const saveMutation = useMutation({
        mutationFn: async (data: ModelConfigFormData) => {
            if (!modelId) throw new Error("Model ID is required")
            return await modelApi.updateModelConfig(modelId, data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["modelConfig", modelId] })
            form.reset(form.getValues())
            toast.success(t("modelDetail.configSaved"))
        },
        onError: () => {
            toast.error(t("modelDetail.configSaveFailed"))
        },
    })

    const onSubmit = (data: ModelConfigFormData) => {
        saveMutation.mutate(data)
    }

    const handleAddTag = () => {
        if (tagInput.trim() && !form.getValues("tags").includes(tagInput.trim())) {
            const currentTags = form.getValues("tags")
            form.setValue("tags", [...currentTags, tagInput.trim()], { shouldDirty: true })
            setTagInput("")
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        const currentTags = form.getValues("tags")
        form.setValue(
            "tags",
            currentTags.filter((tag) => tag !== tagToRemove),
            { shouldDirty: true }
        )
    }

    const watchedTags = useWatch({ control: form.control, name: "tags" })
    const isDirty = form.formState.isDirty


    const jsonPreview = JSON.stringify(
        {
            id: currentModel?.id,
            ...form.getValues(),
        },
        null,
        2
    )

    if (isLoading || isLoadingConfig) {
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
                    <h3 className="font-semibold mb-1">{t("modelDetail.modelNotFound")}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t("modelDetail.modelNotFoundDesc", { modelId })}
                    </p>
                </div>
                <Button onClick={() => navigate("/admin/settings/models")} className="mt-4">
                    <ChevronLeft className="size-4 mr-2" />
                    {t("modelDetail.backToList")}
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
                        onClick={() => navigate("/admin/settings/models")}
                    >
                        <ChevronLeft className="size-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <img src={logogram} alt="Model Icon" className="size-12 rounded-full" />
                        <div>
                            <h1 className="text-2xl font-semibold">{currentModel.id}</h1>
                            <p className="text-sm text-muted-foreground">
                                {currentModel.owned_by}
                            </p>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={saveMutation.isPending || !isDirty}
                >
                    {saveMutation.isPending ? (
                        <>
                            <Loader2 className="size-4 mr-2 animate-spin" />
                            {t("modelDetail.saving")}
                        </>
                    ) : (
                        <>
                            <Save className="size-4 mr-2" />
                            {t("modelDetail.saveAndUpdate")}
                        </>
                    )}
                </Button>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("modelDetail.description")}</CardTitle>
                            <CardDescription>
                                {t("modelDetail.descriptionSubtitle")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="description"
                                render={({
                                    field,
                                }: {
                                    field: ControllerRenderProps<ModelConfigFormData, "description">
                                }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Textarea
                                                placeholder={t("modelDetail.descriptionPlaceholder")}
                                                {...field}
                                                className="min-h-20"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>


                    <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                        <Card>
                            <CollapsibleTrigger className="w-full">
                                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="text-left">
                                            <CardTitle>{t("modelDetail.advancedParameters")}</CardTitle>
                                            <CardDescription>
                                                {t("modelDetail.advancedParametersDesc")}
                                            </CardDescription>
                                        </div>
                                        {isAdvancedOpen ? (
                                            <ChevronUp className="size-5 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="size-5 text-muted-foreground" />
                                        )}
                                    </div>
                                </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="space-y-4 pt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="temperature"
                                            render={({
                                                field,
                                            }: {
                                                field: ControllerRenderProps<
                                                    ModelConfigFormData,
                                                    "temperature"
                                                >
                                            }) => (
                                                <FormItem>
                                                    <FormLabel>{t("modelDetail.temperature")}</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            min="0"
                                                            max="2"
                                                            {...field}
                                                            onChange={(e) =>
                                                                field.onChange(
                                                                    parseFloat(e.target.value)
                                                                )
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormDescription>{t("modelDetail.temperatureDesc")}</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="maxTokens"
                                            render={({
                                                field,
                                            }: {
                                                field: ControllerRenderProps<
                                                    ModelConfigFormData,
                                                    "maxTokens"
                                                >
                                            }) => (
                                                <FormItem>
                                                    <FormLabel>{t("modelDetail.maxTokens")}</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            {...field}
                                                            onChange={(e) =>
                                                                field.onChange(
                                                                    parseInt(e.target.value)
                                                                )
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="topP"
                                            render={({
                                                field,
                                            }: {
                                                field: ControllerRenderProps<
                                                    ModelConfigFormData,
                                                    "topP"
                                                >
                                            }) => (
                                                <FormItem>
                                                    <FormLabel>{t("modelDetail.topP")}</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            min="0"
                                                            max="1"
                                                            {...field}
                                                            onChange={(e) =>
                                                                field.onChange(
                                                                    parseFloat(e.target.value)
                                                                )
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormDescription>{t("modelDetail.topPDesc")}</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="frequencyPenalty"
                                            render={({
                                                field,
                                            }: {
                                                field: ControllerRenderProps<
                                                    ModelConfigFormData,
                                                    "frequencyPenalty"
                                                >
                                            }) => (
                                                <FormItem>
                                                    <FormLabel>{t("modelDetail.frequencyPenalty")}</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            min="-2"
                                                            max="2"
                                                            {...field}
                                                            onChange={(e) =>
                                                                field.onChange(
                                                                    parseFloat(e.target.value)
                                                                )
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormDescription>{t("modelDetail.frequencyPenaltyDesc")}</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="presencePenalty"
                                            render={({
                                                field,
                                            }: {
                                                field: ControllerRenderProps<
                                                    ModelConfigFormData,
                                                    "presencePenalty"
                                                >
                                            }) => (
                                                <FormItem>
                                                    <FormLabel>{t("modelDetail.presencePenalty")}</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            min="-2"
                                                            max="2"
                                                            {...field}
                                                            onChange={(e) =>
                                                                field.onChange(
                                                                    parseFloat(e.target.value)
                                                                )
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormDescription>{t("modelDetail.presencePenaltyDesc")}</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </CollapsibleContent>
                        </Card>
                    </Collapsible>


                    <Card>
                        <CardHeader>
                            <CardTitle>{t("modelDetail.capabilities")}</CardTitle>
                            <CardDescription>
                                {t("modelDetail.capabilitiesDesc")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="capabilities.vision"
                                    render={({
                                        field,
                                    }: {
                                        field: ControllerRenderProps<
                                            ModelConfigFormData,
                                            "capabilities.vision"
                                        >
                                    }) => (
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormLabel className="cursor-pointer">{t("modelDetail.vision")}</FormLabel>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="capabilities.fileUpload"
                                    render={({
                                        field,
                                    }: {
                                        field: ControllerRenderProps<
                                            ModelConfigFormData,
                                            "capabilities.fileUpload"
                                        >
                                    }) => (
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormLabel className="cursor-pointer">
                                                {t("modelDetail.fileUpload")}
                                            </FormLabel>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="capabilities.fileContext"
                                    render={({
                                        field,
                                    }: {
                                        field: ControllerRenderProps<
                                            ModelConfigFormData,
                                            "capabilities.fileContext"
                                        >
                                    }) => (
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormLabel className="cursor-pointer">
                                                {t("modelDetail.fileContext")}
                                            </FormLabel>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="capabilities.webSearch"
                                    render={({
                                        field,
                                    }: {
                                        field: ControllerRenderProps<
                                            ModelConfigFormData,
                                            "capabilities.webSearch"
                                        >
                                    }) => (
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormLabel className="cursor-pointer">
                                                {t("modelDetail.webSearch")}
                                            </FormLabel>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="capabilities.imageGeneration"
                                    render={({
                                        field,
                                    }: {
                                        field: ControllerRenderProps<
                                            ModelConfigFormData,
                                            "capabilities.imageGeneration"
                                        >
                                    }) => (
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormLabel className="cursor-pointer">
                                                {t("modelDetail.imageGeneration")}
                                            </FormLabel>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="capabilities.codeInterpreter"
                                    render={({
                                        field,
                                    }: {
                                        field: ControllerRenderProps<
                                            ModelConfigFormData,
                                            "capabilities.codeInterpreter"
                                        >
                                    }) => (
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormLabel className="cursor-pointer">
                                                {t("modelDetail.codeInterpreter")}
                                            </FormLabel>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="capabilities.usage"
                                    render={({
                                        field,
                                    }: {
                                        field: ControllerRenderProps<
                                            ModelConfigFormData,
                                            "capabilities.usage"
                                        >
                                    }) => (
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormLabel className="cursor-pointer">{t("modelDetail.usage")}</FormLabel>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="capabilities.citations"
                                    render={({
                                        field,
                                    }: {
                                        field: ControllerRenderProps<
                                            ModelConfigFormData,
                                            "capabilities.citations"
                                        >
                                    }) => (
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormLabel className="cursor-pointer">
                                                {t("modelDetail.citations")}
                                            </FormLabel>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="capabilities.statusUpdates"
                                    render={({
                                        field,
                                    }: {
                                        field: ControllerRenderProps<
                                            ModelConfigFormData,
                                            "capabilities.statusUpdates"
                                        >
                                    }) => (
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormLabel className="cursor-pointer">
                                                {t("modelDetail.statusUpdates")}
                                            </FormLabel>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="capabilities.builtinTools"
                                    render={({
                                        field,
                                    }: {
                                        field: ControllerRenderProps<
                                            ModelConfigFormData,
                                            "capabilities.builtinTools"
                                        >
                                    }) => (
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormLabel className="cursor-pointer">
                                                {t("modelDetail.builtinTools")}
                                            </FormLabel>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>


                    <Card>
                        <CardHeader>
                            <CardTitle>{t("modelDetail.defaultFeatures")}</CardTitle>
                            <CardDescription>
                                {t("modelDetail.defaultFeaturesDesc")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <FormField
                                control={form.control}
                                name="defaultFeatures.webSearch"
                                render={({
                                    field,
                                }: {
                                    field: ControllerRenderProps<
                                        ModelConfigFormData,
                                        "defaultFeatures.webSearch"
                                    >
                                }) => (
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel className="cursor-pointer">
                                            {t("modelDetail.webSearch")}
                                        </FormLabel>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="defaultFeatures.imageGeneration"
                                render={({
                                    field,
                                }: {
                                    field: ControllerRenderProps<
                                        ModelConfigFormData,
                                        "defaultFeatures.imageGeneration"
                                    >
                                }) => (
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel className="cursor-pointer">
                                            {t("modelDetail.imageGeneration")}
                                        </FormLabel>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="defaultFeatures.codeInterpreter"
                                render={({
                                    field,
                                }: {
                                    field: ControllerRenderProps<
                                        ModelConfigFormData,
                                        "defaultFeatures.codeInterpreter"
                                    >
                                }) => (
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel className="cursor-pointer">
                                            {t("modelDetail.codeInterpreter")}
                                        </FormLabel>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>


                    <Card>
                        <CardHeader>
                            <CardTitle>{t("modelDetail.ttsVoice")}</CardTitle>
                            <CardDescription>{t("modelDetail.ttsVoiceDesc")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="ttsVoice"
                                render={({
                                    field,
                                }: {
                                    field: ControllerRenderProps<ModelConfigFormData, "ttsVoice">
                                }) => (
                                    <FormItem>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t("modelDetail.selectVoice")} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="alloy">Alloy</SelectItem>
                                                <SelectItem value="echo">Echo</SelectItem>
                                                <SelectItem value="fable">Fable</SelectItem>
                                                <SelectItem value="onyx">Onyx</SelectItem>
                                                <SelectItem value="nova">Nova</SelectItem>
                                                <SelectItem value="shimmer">Shimmer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>


                    <Card>
                        <CardHeader>
                            <CardTitle>{t("modelDetail.tags")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex gap-2">
                                <Input
                                    placeholder={t("modelDetail.tagsPlaceholder")}
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault()
                                            handleAddTag()
                                        }
                                    }}
                                />
                                <Button type="button" onClick={handleAddTag} variant="outline">
                                    <Plus className="size-4" />
                                </Button>
                            </div>

                            {watchedTags && watchedTags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {watchedTags.map((tag) => (
                                        <Badge key={tag} variant="secondary">
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTag(tag)}
                                                className="ml-2 hover:text-destructive"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>


                    <Card>
                        <CardHeader>
                            <CardTitle>{t("modelDetail.jsonPreview")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={jsonPreview}
                                readOnly
                                className="min-h-64 font-mono text-xs"
                            />
                        </CardContent>
                    </Card>
                </form>
            </Form>
        </div>
    )
}

export { ModelDetailPage }
