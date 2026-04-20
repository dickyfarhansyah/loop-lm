import { Outlet } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { UserSettingsSidebar, UserSettingsTabs } from "./components"
import { Button } from "@/components/ui/button"

function UserSettingsLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleClose = () => {
    navigate("/")
  }

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-background">
      
      <div className="hidden md:block  shrink-0 p-6  overflow-y-auto">
        <h1 className="text-lg font-semibold mb-6">{t("userSettings.title")}</h1>
        <UserSettingsSidebar />
      </div>

      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        <div className="md:hidden flex items-center justify-between p-4 border-b">
          <h1 className="text-lg font-semibold">{t("userSettings.title")}</h1>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="size-5" />
          </Button>
        </div>

        
        <div className="md:hidden border-b">
          <UserSettingsTabs />
        </div>

        
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export { UserSettingsLayout }
