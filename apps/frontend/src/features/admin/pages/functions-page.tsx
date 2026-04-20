import { useTranslation } from "react-i18next"
import { UnderDevelopmentAlert } from "@/components/under-development-alert"

function FunctionsPage() {
  const { t } = useTranslation()
  return (
    <div className="p-6 space-y-5">
      <UnderDevelopmentAlert />
      <h2 className="text-lg font-semibold mb-4">{t("adminPage.functionsTitle")}</h2>
      <p className="text-muted-foreground">{t("adminPage.functionsDesc")}</p>
    </div>
  )
}

export { FunctionsPage }
