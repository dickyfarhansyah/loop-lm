import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import * as React from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { useAuthSettings, useUpdateAuthSettings } from "../hooks/use-settings"
import type { AuthSettings } from "../types/settings"

function AuthenticationSettingsPage() {
  const { t } = useTranslation()
  const { data: settings, isLoading } = useAuthSettings()
  const updateSettings = useUpdateAuthSettings()
  const [localSettings, setLocalSettings] = React.useState<Partial<AuthSettings>>({})

  React.useEffect(() => {
    if (settings) {
      setLocalSettings(settings)
    }
  }, [settings])

  const handleChange = <K extends keyof AuthSettings>(key: K, value: AuthSettings[K]) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }))
  }

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
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <Label>{t("settingsPage.authDefaultUserRole")}</Label>
        <Select
          value={localSettings.default_user_role || "pending"}
          onValueChange={(val) => handleChange("default_user_role", val as any)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">{t("settingsPage.authRolePending")}</SelectItem>
            <SelectItem value="user">{t("settingsPage.authRoleUser")}</SelectItem>
            <SelectItem value="admin">{t("settingsPage.authRoleAdmin")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label>{t("settingsPage.authDefaultGroup")}</Label>
        <Select
          value={localSettings.default_group || "none"}
          onValueChange={(val) => handleChange("default_group", val === "none" ? "" : val)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>

          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label>{t("settingsPage.authEnableSignup")}</Label>
        <Switch
          checked={localSettings.enable_signup ?? false}
          onCheckedChange={(val) => handleChange("enable_signup", val)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>{t("settingsPage.authShowAdminDetails")}</Label>
        <Switch
          checked={localSettings.show_admin_details ?? true}
          onCheckedChange={(val) => handleChange("show_admin_details", val)}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("settingsPage.authAdminEmail")}</Label>
        <Input
          placeholder={t("settingsPage.authAdminEmailPlaceholder")}
          value={localSettings.admin_email || ""}
          onChange={(e) => handleChange("admin_email", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("settingsPage.authPendingTitle")}</Label>
        <Input
          placeholder={t("settingsPage.authPendingTitlePlaceholder")}
          value={localSettings.pending_user_overlay_title || ""}
          onChange={(e) => handleChange("pending_user_overlay_title", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("settingsPage.authPendingContent")}</Label>
        <Textarea
          placeholder={t("settingsPage.authPendingContentPlaceholder")}
          className="min-h-20"
          value={localSettings.pending_user_overlay_content || ""}
          onChange={(e) => handleChange("pending_user_overlay_content", e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>{t("settingsPage.authEnableApiKeys")}</Label>
        <Switch
          checked={localSettings.enable_api_keys ?? false}
          onCheckedChange={(val) => handleChange("enable_api_keys", val)}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("settingsPage.authJwtExpiry")}</Label>
        <Input
          value={localSettings.jwt_expiry || "4w"}
          onChange={(e) => handleChange("jwt_expiry", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {t("settingsPage.authJwtExpiryHint")}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Label>{t("settingsPage.authLdap")}</Label>
        <Switch
          checked={localSettings.enable_ldap ?? false}
          onCheckedChange={(val) => handleChange("enable_ldap", val)}
        />
      </div>


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

export { AuthenticationSettingsPage }

