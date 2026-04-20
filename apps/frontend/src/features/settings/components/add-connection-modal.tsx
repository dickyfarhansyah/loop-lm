import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2, Plus } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import type { AuthType, ProviderType } from "../types"
import { connectionFormSchema, type ConnectionFormValues } from "../schemas"

interface AddConnectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  providerType: ProviderType
  onSave?: (data: ConnectionFormValues & { name: string; providerType: ProviderType }) => void
  isLoading?: boolean
}

const PROVIDER_TYPE_DISPLAY: Record<ProviderType, string> = {
  openai: "OpenAI",
  ollama: "Ollama",
  anthropic: "Anthropic",
  azure: "Azure",
  google: "Google",
  custom: "Custom",
}

function AddConnectionModal({
  open,
  onOpenChange,
  providerType,
  onSave,
  isLoading = false,
}: AddConnectionModalProps) {
  const [showApiKey, setShowApiKey] = useState(false)
  const [name, setName] = useState("")

  const form = useForm<ConnectionFormValues>({
    resolver: zodResolver(connectionFormSchema),
    defaultValues: {
      url: providerType === "ollama" ? "http://localhost:11434" : "",
      authType: providerType === "ollama" ? "none" : "bearer",
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

  const onSubmit = (data: ConnectionFormValues) => {
    if (!name.trim()) return
    onSave?.({
      ...data,
      name: name.trim(),
      providerType,
    })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset()
      setName("")
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Tambah Koneksi {PROVIDER_TYPE_DISPLAY[providerType]}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Nama Koneksi</Label>
            <Input
              placeholder={`Contoh: ${PROVIDER_TYPE_DISPLAY[providerType]} Production`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={!name.trim() ? "border-destructive" : ""}
            />
            {!name.trim() && (
              <p className="text-sm text-destructive">Nama koneksi wajib diisi</p>
            )}
          </div>

          
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">URL</Label>
            <Input
              {...register("url")}
              placeholder={providerType === "ollama" ? "http://localhost:11434" : "https://api.openai.com/v1"}
              className={errors.url ? "border-destructive" : ""}
            />
            {errors.url && (
              <p className="text-sm text-destructive">{errors.url.message}</p>
            )}
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
                  placeholder={authType === "none" ? "" : "API Key atau Token"}
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
            <Label className="text-muted-foreground">Headers (Optional)</Label>
            <Textarea
              placeholder='{"X-Custom-Header": "value"}'
              {...register("headers")}
              className={`min-h-15 resize-y font-mono text-sm ${errors.headers ? "border-destructive" : ""}`}
            />
            {errors.headers && (
              <p className="text-sm text-destructive">{errors.headers.message}</p>
            )}
          </div>

          
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="rounded-full px-6"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Plus className="size-4 mr-2" />
                  Tambah
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { AddConnectionModal }
