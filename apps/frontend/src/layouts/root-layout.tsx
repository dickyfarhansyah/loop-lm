import { Outlet } from "react-router-dom"

import { AppSidebar } from "@/components/sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { useDocumentTitle, useDynamicFavicon } from "@/hooks"
import { useThemeColor } from "@/hooks/use-theme-color"
import { useGeneralSettings } from "@/features/settings/hooks/use-settings"

function RootLayoutContent() {
  useDocumentTitle()
  useThemeColor()
  useDynamicFavicon()
  const { data: generalSettings } = useGeneralSettings()
  const appName = generalSettings?.webui_name || ""

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-screen flex flex-col overflow-hidden">

        <div className="md:hidden flex items-center gap-2 p-2 border-b">
          <SidebarTrigger />
          <span className="font-medium">{appName}</span>
        </div>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden p-4">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function RootLayout() {
  return <RootLayoutContent />
}

export { RootLayout }
