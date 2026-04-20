import { ChevronDown } from "lucide-react"
import * as React from "react"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/hooks/use-theme"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useMe, useUpdateMe } from "@/hooks/use-auth"
import { toast } from "sonner"

interface UserSettings {
  ui?: {
    theme?: string
    language?: string
  }
  notifications?: boolean
  systemPrompt?: string
  [key: string]: unknown
}

function GeneralSettingsPage() {
  const { t, i18n } = useTranslation()
  const { data: user } = useMe()
  const { mutate: updateMe } = useUpdateMe()
  const { theme, setTheme } = useTheme()


  const [language, setLanguage] = React.useState("id")
  const [notifications, setNotifications] = React.useState(false)
  const [showAdvanced, setShowAdvanced] = React.useState(false)


  React.useEffect(() => {
    if (user && user.settings) {

      const settings = user.settings as UserSettings
      if (settings?.ui?.theme) setTheme(settings.ui.theme as "light" | "dark" | "system")
      if (settings?.ui?.language) setLanguage(settings.ui.language)
      if (settings?.notifications) setNotifications(settings.notifications)
    }
  }, [user, setTheme])

  const handleLanguageChange = (value: string) => {
    setLanguage(value)

  }

  const handleSave = () => {

    const currentSettings = (user?.settings as UserSettings | null) || {}

    const newSettings: UserSettings = {
      ...currentSettings,
      ui: {
        ...(currentSettings.ui || {}),
        theme,
        language,
      },
      notifications,
    }

    updateMe(
      { settings: newSettings },
      {
        onSuccess: () => {

          i18n.changeLanguage(language)
          toast.success(t("settings.saved"))
        },
        onError: () => {
          toast.error("Gagal menyimpan pengaturan")
        },
      }
    )
  }

  return (
    <div className="w-full ">
      <h2 className="text-xl font-semibold mb-6">{t("settings.title")}</h2>

      <div className="space-y-6">

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t("settings.theme")}</span>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{t("themes.light")}</SelectItem>
              <SelectItem value="dark">{t("themes.dark")}</SelectItem>
              <SelectItem value="system">{t("themes.system")}</SelectItem>
            </SelectContent>
          </Select>
        </div>


        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t("settings.language")}</span>
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">{t("languages.id")}</SelectItem>
              <SelectItem value="en">{t("languages.en")}</SelectItem>
              <SelectItem value="ja">{t("languages.ja")}</SelectItem>
            </SelectContent>
          </Select>
        </div>


        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t("settings.notifications")}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {notifications ? t("settings.on") : t("settings.off")}
            </span>
            <Switch
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>
        </div>


        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t("settings.advanced")}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? t("settings.hide") : t("settings.show")}
            <ChevronDown className={`size-4 ml-1 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
          </Button>
        </div>

        {showAdvanced && (
          <div className="pl-4 border-l-2 space-y-4">
            <p className="text-sm text-muted-foreground">
              Parameter lanjutan akan ditampilkan di sini.
            </p>
          </div>
        )}
      </div>


      <div className="fixed bottom-6 right-6">
        <Button onClick={handleSave}>{t("settings.save")}</Button>
      </div>
    </div>
  )
}

export { GeneralSettingsPage }
