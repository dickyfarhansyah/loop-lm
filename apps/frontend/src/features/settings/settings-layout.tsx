import { useEffect } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"

import { SettingsSidebar, SettingsMobileTabs } from "./components"

function SettingsLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  
  useEffect(() => {
    if (location.pathname === "/admin/settings" || location.pathname === "/admin/settings/") {
      navigate("/admin/settings/general", { replace: true })
    }
  }, [location.pathname, navigate])

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-8 w-full h-full overflow-hidden">
      
      <div className="shrink-0 px-4 pt-4 md:px-0 md:pt-0">
        <SettingsMobileTabs />
      </div>

      
      <div className="hidden md:block shrink-0 pl-6 pt-6">
        <SettingsSidebar />
      </div>

      <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  )
}

export { SettingsLayout }
