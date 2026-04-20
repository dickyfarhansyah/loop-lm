import { Button } from "@/components/ui/button"
import * as React from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { useGeneralSettings, useUpdateGeneralSettings } from "../hooks/use-settings"
import type { GeneralSettings } from "../types/settings"

function GeneralSettingsPage() {
  const { t } = useTranslation()
  const { data: settings, isLoading } = useGeneralSettings()
  const updateSettings = useUpdateGeneralSettings()
  const [localSettings, setLocalSettings] = React.useState<Partial<GeneralSettings>>({})

  React.useEffect(() => {
    if (settings) {
      setLocalSettings(settings)
    }
  }, [settings])

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(localSettings)
      toast.success(t("settingsPage.savedSuccess"))
    } catch {
      toast.error(t("settingsPage.saveFailed"))
    }
  }

  if (isLoading) {
    return <div className="p-4">{t("settingsPage.loading")}</div>
  }

  return (
    <div className="space-y-8 pb-24">
      <section>
        <h2 className="text-lg font-medium mb-4">{t("settingsPage.versionTitle")}</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">{t("settingsPage.versionLatest")}</p>
            <a href="#" className="text-sm text-primary hover:underline">
              {t("settingsPage.versionWhatsNew")}
            </a>
          </div>
          <Button variant="link" className="text-primary">
            {t("settingsPage.versionCheckUpdates")}
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-2">{t("settingsPage.helpTitle")}</h2>
        <p className="text-sm text-muted-foreground mb-3">
          {t("settingsPage.helpDesc")}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="gap-2">
            <span>{t("settingsPage.helpContactUs")}</span>
          </Button>
          <Button variant="outline" size="sm">
            {t("settingsPage.helpDocumentation")}
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-2">{t("settingsPage.licenseTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("settingsPage.licenseDesc")}
        </p>
      </section>

      {/* Spacer for sticky button */}
      <div className="h-16" />

      {/* Sticky Save Button */}
      <div className="fixed bottom-0 right-0 p-4 md:p-6 bg-background/80 backdrop-blur-sm border-t md:border-t-0 z-10">
        <Button
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="rounded-full px-6"
        >
          {updateSettings.isPending ? t("settingsPage.savingBtn") : t("settingsPage.saveBtn")}
        </Button>
      </div>
    </div>
  )
}

export { GeneralSettingsPage }

