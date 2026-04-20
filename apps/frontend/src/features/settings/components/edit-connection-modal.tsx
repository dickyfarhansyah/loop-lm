import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2, Plus, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { AuthType, Connection, ConnectionType, ProviderType } from "../types"
import { connectionFormSchema, type ConnectionFormValues } from "../schemas"

interface EditConnectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connection?: Connection
  onSave?: (data: ConnectionFormValues) => void
  onDelete?: () => void
  onVerify?: () => void
  isLoading?: boolean
  isVerifying?: boolean
}

const PROVIDER_TYPE_DISPLAY: Record<ProviderType, string> = {
  openai: "OpenAI",
  ollama: "Ollama",
  anthropic: "Anthropic",
  azure: "Azure",
  google: "Google",
  custom: "Custom",
}

const CONNECTION_TYPE_DISPLAY: Record<ConnectionType, string> = {
  internal: "Internal",
  external: "External",
}

function EditConnectionModal({
  open,
  onOpenChange,
  connection,
  onSave,
  onDelete,
  onVerify,
  isLoading = false,
  isVerifying = false,
}: EditConnectionModalProps) {
  const [showApiKey, setShowApiKey] = useState(false)
  const [newModelId, setNewModelId] = useState("")

  const form = useForm<ConnectionFormValues>({
    resolver: zodResolver(connectionFormSchema),
    defaultValues: {
      url: "",
      authType: "bearer",
      authValue: "",
      headers: "",
      prefixId: "",
      modelIds: [],
      tags: [],
      isEnabled: true,
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = form

  const authType = useWatch({ control, name: "authType" })
  const url = useWatch({ control, name: "url" })
  const watchedModelIds = useWatch({ control, name: "modelIds" })
  const watchedTags = useWatch({ control, name: "tags" })
  const isEnabled = useWatch({ control, name: "isEnabled" })

  
  const modelIds = Array.isArray(watchedModelIds) ? watchedModelIds : []
  const tags = Array.isArray(watchedTags) ? watchedTags : []

  
  useEffect(() => {
    if (open) {
      if (connection) {
        reset({
          url: connection.url,
          authType: connection.authType,
          authValue: connection.authValue ?? "",
          headers: connection.headers ? JSON.stringify(connection.headers, null, 2) : "",
          prefixId: connection.prefixId ?? "",
          modelIds: connection.modelIds ?? [],
          tags: connection.tags ?? [],
          isEnabled: connection.isEnabled,
        })
      } else {
        reset({
          url: "",
          authType: "bearer",
          authValue: "",
          headers: "",
          prefixId: "",
          modelIds: [],
          tags: [],
          isEnabled: true,
        })
      }
    }
  }, [connection, open, reset])

  const handleAddModelId = () => {
    if (newModelId.trim() && !modelIds.includes(newModelId.trim())) {
      setValue("modelIds", [...modelIds, newModelId.trim()])
      setNewModelId("")
    }
  }

  const handleRemoveModelId = (id: string) => {
    setValue("modelIds", modelIds.filter((m) => m !== id))
  }

  const handleAddTag = () => {
    const newTag = prompt("Masukkan tag baru:")
    if (newTag && !tags.includes(newTag)) {
      setValue("tags", [...tags, newTag])
    }
  }

  const handleRemoveTag = (tag: string) => {
    setValue("tags", tags.filter((t) => t !== tag))
  }

  const onSubmit = (data: ConnectionFormValues) => {
    onSave?.(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Edit Connection
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground">Connection Type</Label>
            <span className="text-sm">
              {connection?.type ? CONNECTION_TYPE_DISPLAY[connection.type] : "External"}
            </span>
          </div>

          
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">URL</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  {...register("url")}
                  className={errors.url ? "border-destructive" : ""}
                />
                {errors.url && (
                  <p className="text-sm text-destructive mt-1">{errors.url.message}</p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={onVerify}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
              </Button>
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => setValue("isEnabled", checked)}
              />
            </div>
          </div>

          
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Auth</Label>
            <div className="flex items-center gap-2">
              <Select
                value={authType}
                onValueChange={(v) => setValue("authType", v as AuthType)}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bearer">Bearer</SelectItem>
                  <SelectItem value="api_key">API Key</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Input
                  type={showApiKey ? "text" : "password"}
                  {...register("authValue")}
                  className="pr-10"
                  disabled={authType === "none"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowApiKey(!showApiKey)}
                  disabled={authType === "none"}
                >
                  {showApiKey ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Headers</Label>
            <Textarea
              placeholder="Enter additional headers in JSON format"
              {...register("headers")}
              className={`min-h-15 resize-y font-mono text-sm ${errors.headers ? "border-destructive" : ""}`}
            />
            {errors.headers && (
              <p className="text-sm text-destructive">{errors.headers.message}</p>
            )}
          </div>

          
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Prefix ID</Label>
            <Input
              placeholder="Prefix ID"
              {...register("prefixId")}
            />
          </div>

          
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground">Provider Type</Label>
            <span className="text-sm">
              {connection?.providerType
                ? PROVIDER_TYPE_DISPLAY[connection.providerType]
                : "OpenAI"}
            </span>
          </div>

          
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Model IDs</Label>
            <p className="text-sm text-muted-foreground text-center py-2">
              Leave empty to include all models from
              <br />
              &quot;{url}/models&quot; endpoint
            </p>
            {modelIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {modelIds.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
                  >
                    {id}
                    <button
                      type="button"
                      onClick={() => handleRemoveModelId(id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add a model ID"
                value={newModelId}
                onChange={(e) => setNewModelId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddModelId()
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleAddModelId}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Tags</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                type="button"
                className="inline-flex items-center gap-1 px-2 py-1 border border-dashed rounded-md text-sm text-muted-foreground hover:text-foreground hover:border-foreground"
                onClick={handleAddTag}
              >
                <Plus className="size-3" />
                Tambahkan Tag
              </button>
            </div>
          </div>

          
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={onDelete} disabled={isLoading}>
              Menghapus
            </Button>
            <Button
              type="submit"
              className="rounded-full px-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { EditConnectionModal }
