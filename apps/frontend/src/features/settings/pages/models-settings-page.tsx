import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Download, Loader2, Search, Settings, Edit, MoreVertical, Trash2, Copy, Star, Pin } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAvailableModels } from "../hooks"
import type { Model } from "../types"
import staticLogogram from "@/assets/images/logogram.png"
import { useAppLogo } from "@/hooks/use-app-logo"
import { toast } from "sonner"
import { modelApi } from "@/api/model.api"

function ModelsSettingsPage() {
  const { t } = useTranslation()
  const { logogram: uploadedLogogram } = useAppLogo()
  const logogram = uploadedLogogram || staticLogogram
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)

  const { data, isLoading } = useAvailableModels()
  const models = data?.data ?? []


  const setDefaultMutation = useMutation({
    mutationFn: (modelId: string) => modelApi.setModelDefault(modelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models", "available"] })
      toast.success(t("settingsPage.modelDefaultChanged"))
    },
    onError: () => toast.error(t("settingsPage.modelDefaultChangeFailed")),
  })


  const togglePinnedMutation = useMutation({
    mutationFn: (modelId: string) => modelApi.toggleModelPinned(modelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models", "available"] })
      toast.success(t("settingsPage.modelPinChanged"))
    },
    onError: () => toast.error(t("settingsPage.modelPinChangeFailed")),
  })


  const toggleEnabledMutation = useMutation({
    mutationFn: ({ modelId, isEnabled }: { modelId: string; isEnabled: boolean }) =>
      modelApi.toggleModelEnabled(modelId, isEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models", "available"] })
    },
    onError: (error) => {
      console.error("Error toggling model:", error)
      toast.error(t("settingsPage.modelToggleFailed"))
    },
  })

  const handleToggleModel = (modelId: string, enabled: boolean) => {
    toggleEnabledMutation.mutate(
      { modelId, isEnabled: enabled },
      {
        onSuccess: () => {
          toast.success(enabled ? "Model diaktifkan" : "Model dinonaktifkan")
        },
      }
    )
  }


  const filteredModels = models.filter(
    (model) =>
      model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.owned_by.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.connection.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{t("settingsPage.modelsTitle")}</h1>
          <span className="text-muted-foreground">{models.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Download className="size-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="size-4" />
          </Button>
        </div>
      </div>


      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={t("settingsPage.modelsSearch")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>


      <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
        {filteredModels.map((model) => {
          const isEnabled = model.isEnabled ?? true

          return (
            <div
              key={model.id}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${selectedModel?.id === model.id
                ? "bg-muted"
                : "hover:bg-muted/50"
                } ${!isEnabled ? "opacity-50" : ""}`}
              onClick={() => setSelectedModel(model)}
            >
              <div className="flex items-center gap-3">

                <img src={logogram} alt="Logo" className="size-8 rounded-full" />


                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium">{model.id}</p>
                    {model.isDefault && (
                      <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                    )}
                    {model.isPinned && (
                      <Pin className="size-3.5 fill-blue-400 text-blue-400" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{model.connection}</p>
                </div>
              </div>


              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/admin/settings/models/${encodeURIComponent(model.id)}`)
                  }}
                  title="Edit Model"
                >
                  <Edit className="size-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        setDefaultMutation.mutate(model.id)
                      }}
                      disabled={model.isDefault}
                    >
                      <Star className={`size-4 mr-2 ${model.isDefault ? "fill-yellow-400 text-yellow-400" : ""}`} />
                      {model.isDefault ? t("settingsPage.modelDefaultLabel") : t("settingsPage.modelSetDefault")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        togglePinnedMutation.mutate(model.id)
                      }}
                    >
                      <Pin className={`size-4 mr-2 ${model.isPinned ? "fill-blue-400 text-blue-400" : ""}`} />
                      {model.isPinned ? t("settingsPage.modelUnpin") : t("settingsPage.modelPin")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()

                        toast.info(t("settingsPage.modelDuplicateNotAvailable"))
                      }}
                    >
                      <Copy className="size-4 mr-2" />
                      {t("settingsPage.modelDuplicate")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()

                        toast.info(t("settingsPage.modelDeleteNotAvailable"))
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="size-4 mr-2" />
                      {t("settingsPage.modelDelete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) => handleToggleModel(model.id, checked)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )
        })}

        {filteredModels.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery
              ? t("settingsPage.modelsNoResults", { query: searchQuery })
              : t("settingsPage.modelsNoModels")}
          </div>
        )}
      </div>
    </div>
  )
}

export { ModelsSettingsPage }
