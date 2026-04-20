import { useTranslation } from "react-i18next"

function SettingsPage() {
  const { t } = useTranslation()
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">{t("adminPage.settingsTitle")}</h2>
      <p className="text-muted-foreground">{t("adminPage.settingsDesc")}</p>
    </div>
  )
}

export { SettingsPage }
