import { Outlet } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { SettingsTabs } from "../components"

function GeneralSettingsLayout() {
  const { t } = useTranslation()

  const GENERAL_TABS = [
    { label: t("settingsPage.tabGeneral"), href: "/admin/settings/general" },
    { label: t("settingsPage.tabAuthentication"), href: "/admin/settings/general/authentication" },
    { label: t("settingsPage.tabFeatures"), href: "/admin/settings/general/features" },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">{t("settingsPage.generalTitle")}</h1>
      <SettingsTabs tabs={GENERAL_TABS} />
      <Outlet />
    </div>
  )
}

export { GeneralSettingsLayout }

