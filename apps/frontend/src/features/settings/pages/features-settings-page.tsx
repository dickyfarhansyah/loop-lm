import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useTranslation } from "react-i18next"

function FeaturesSettingsPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label>{t("settingsPage.featuresCommunitySharing")}</Label>
        <Switch defaultChecked />
      </div>

      <div className="flex items-center justify-between">
        <Label>{t("settingsPage.featuresMessageRating")}</Label>
        <Switch defaultChecked />
      </div>

      <div className="flex items-center justify-between">
        <Label>{t("settingsPage.featuresFolders")}</Label>
        <Switch defaultChecked />
      </div>

      <div className="space-y-2">
        <Label>{t("settingsPage.featuresFolderMaxCount")}</Label>
        <Input placeholder={t("settingsPage.featuresFolderMaxCountPlaceholder")} />
        <p className="text-xs text-muted-foreground">
          {t("settingsPage.featuresFolderMaxCountHint")}
        </p>
      </div>

      <div className="flex justify-end pt-4">
        <Button className="rounded-full px-6">{t("settingsPage.saveBtn")}</Button>
      </div>
    </div>
  )
}

export { FeaturesSettingsPage }

