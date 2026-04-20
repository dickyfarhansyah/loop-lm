import { Plus, X } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { GradientPicker } from "@/components/gradient-picker"
import { ImageUpload } from "@/components/image-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useGeneralSettings, useUpdateGeneralSettings, useUISettings, useUpdateUISettings } from "../hooks/use-settings"
import type { GeneralSettings, PromptSuggestion, UISettings } from "../types/settings"

function InterfaceSettingsPage() {
  const { t } = useTranslation()
  const { data: generalSettings, isLoading: generalLoading } = useGeneralSettings()
  const { data: uiSettings, isLoading: uiLoading } = useUISettings()
  const updateGeneral = useUpdateGeneralSettings()
  const updateUI = useUpdateUISettings()

  const [localGeneralSettings, setLocalGeneralSettings] = React.useState<Partial<GeneralSettings>>({})
  const [localUISettings, setLocalUISettings] = React.useState<Partial<UISettings>>({})
  const [promptSuggestions, setPromptSuggestions] = React.useState<PromptSuggestion[]>([])

  React.useEffect(() => {
    if (generalSettings) setLocalGeneralSettings(generalSettings)
  }, [generalSettings])

  React.useEffect(() => {
    if (uiSettings) {
      setLocalUISettings(uiSettings)
      setPromptSuggestions(uiSettings.default_prompt_suggestions || [])
    }
  }, [uiSettings])

  const handleAddPromptSuggestion = () => {
    const newSuggestion: PromptSuggestion = {
      id: crypto.randomUUID(),
      title: "",
      subtitle: "",
      content: "",
    }
    setPromptSuggestions((prev) => [...prev, newSuggestion])
  }

  const handleRemovePromptSuggestion = (id: string) => {
    setPromptSuggestions((prev) => prev.filter((s) => s.id !== id))
  }

  const handleSave = async () => {
    try {
      await Promise.all([
        updateGeneral.mutateAsync(localGeneralSettings),
        updateUI.mutateAsync({
          ...localUISettings,
          default_prompt_suggestions: promptSuggestions,
        }),
      ])
      toast.success(t("settingsPage.interfaceSavedSuccess"))
    } catch {
      toast.error(t("settingsPage.interfaceSaveFailed"))
    }
  }

  if (generalLoading || uiLoading) {
    return <div className="p-4">{t("settingsPage.loading")}</div>
  }

  return (
    <div className="space-y-8 w-full">

      <section>
        <h2 className="text-lg font-medium mb-4">{t("settingsPage.generalTitle")}</h2>
        <div className="space-y-2">
          <Label htmlFor="webui_name">{t("settingsPage.webuiName")}</Label>
          <p className="text-xs text-muted-foreground">{t("settingsPage.webuiNameDesc")}</p>
          <Input
            id="webui_name"
            value={localGeneralSettings.webui_name ?? ""}
            onChange={(e) => setLocalGeneralSettings((prev) => ({ ...prev, webui_name: e.target.value }))}
            placeholder="My AI App"
            className="max-w-sm"
          />
        </div>
        <div className="space-y-2 mt-4">
          <Label htmlFor="logo_url">{t("settingsPage.logoUrl")}</Label>
          <p className="text-xs text-muted-foreground">{t("settingsPage.logoUrlDesc")}</p>
          <ImageUpload
            value={(localGeneralSettings as any).logo_url ?? ""}
            onChange={(url) => setLocalGeneralSettings((prev) => ({ ...prev, logo_url: url } as any))}
            placeholder={t("settingsPage.logoUrlUpload")}
          />
        </div>
        <div className="space-y-2 mt-4">
          <Label htmlFor="logo_icon_url">{t("settingsPage.logoIconUrl")}</Label>
          <p className="text-xs text-muted-foreground">{t("settingsPage.logoIconUrlDesc")}</p>
          <ImageUpload
            value={(localGeneralSettings as any).logo_icon_url ?? ""}
            onChange={(url) => setLocalGeneralSettings((prev) => ({ ...prev, logo_icon_url: url } as any))}
            placeholder={t("settingsPage.logoIconUrlUpload")}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-4">{t("settingsPage.interfaceSectionUI")}</h2>

        <div className="space-y-2 mb-6">
          <Label>{t("settingsPage.uiPrimaryColor")}</Label>
          <p className="text-xs text-muted-foreground">{t("settingsPage.uiPrimaryColorDesc")}</p>
          <div className="flex items-center gap-3">
            <GradientPicker
              background={localUISettings.primary_color || ""}
              setBackground={(value) => setLocalUISettings((prev) => ({ ...prev, primary_color: value }))}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocalUISettings((prev) => ({ ...prev, primary_color: "" }))}
            >
              {t("settingsPage.uiPrimaryColorReset")}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>{t("settingsPage.uiBanner")}</Label>
            <Button variant="ghost" size="icon">
              <Plus className="size-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <Label>{t("settingsPage.uiDefaultPromptSuggestions")}</Label>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                {t("settingsPage.uiImport")}
              </Button>
              <Button variant="ghost" size="sm">
                {t("settingsPage.uiExport")}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleAddPromptSuggestion}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            {promptSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="flex items-start gap-4 py-3 border-b last:border-b-0">
                <div className="w-48 shrink-0">
                  <p className="font-medium text-sm">{suggestion.title || t("settingsPage.uiUntitled")}</p>
                  <p className="text-sm text-muted-foreground">{suggestion.subtitle}</p>
                </div>
                <p className="flex-1 text-sm">{suggestion.content}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemovePromptSuggestion(suggestion.id)}
                  className="shrink-0"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          {t("settingsPage.uiUniversalChangeNote")}
        </p>
      </section>

      <div className="h-16" />

      <div className="fixed bottom-0 right-0 p-4 md:p-6 bg-background/80 backdrop-blur-sm border-t md:border-t-0">
        <Button
          onClick={handleSave}
          disabled={updateGeneral.isPending || updateUI.isPending}
          className="rounded-full px-6"
        >
          {updateGeneral.isPending || updateUI.isPending ? t("settingsPage.savingBtn") : t("settingsPage.saveBtn")}
        </Button>
      </div>
    </div>
  )
}

export { InterfaceSettingsPage }
