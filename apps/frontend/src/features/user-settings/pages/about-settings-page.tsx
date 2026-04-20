import { useTranslation } from "react-i18next"
import { ExternalLink, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useGeneralSettings } from "@/features/settings/hooks/use-settings"

function AboutSettingsPage() {
  const { t } = useTranslation()
  const { data: generalSettings } = useGeneralSettings()
  const appName = generalSettings?.webui_name || ""
  const version = "1.0.0"

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{t("about.title", { appName })}</h2>
        <p className="text-muted-foreground">{t("about.description")}</p>
      </div>


      <Card>
        <CardHeader>
          <CardTitle>{t("about.appInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">{t("about.version")}</span>
            <span className="text-muted-foreground">{version}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-medium">{t("about.releaseDate")}</span>
            <span className="text-muted-foreground">February 2026</span>
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>{t("about.features")}</CardTitle>
          <CardDescription>{t("about.featuresDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>{t("about.feature1")}</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>{t("about.feature2")}</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>{t("about.feature3")}</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>{t("about.feature4")}</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>{t("about.feature5")}</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>{t("about.feature6")}</span>
            </li>
          </ul>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>{t("about.techStack")}</CardTitle>
          <CardDescription>{t("about.techStackDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold mb-2">{t("about.frontend")}</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• React 18</li>
                <li>• TypeScript</li>
                <li>• Vite</li>
                <li>• TailwindCSS</li>
                <li>• Shadcn UI</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">{t("about.backend")}</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Hono</li>
                <li>• Drizzle ORM</li>
                <li>• SQLite</li>
                <li>• Socket.IO</li>
                <li>• JWT Auth</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="size-4 text-red-500" />
            {t("about.credits")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>{t("about.creditsDesc", { appName })}</p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" size="sm" asChild>
              <a href="#" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4 mr-2" />
                {t("about.documentation")}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>{t("about.license")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>{t("about.licenseDesc")}</p>
        </CardContent>
      </Card>


      <div className="text-center text-sm text-muted-foreground py-4">
        <p>© 2026 {appName}. {t("about.allRightsReserved")}</p>
      </div>
    </div>
  )
}

export { AboutSettingsPage }
