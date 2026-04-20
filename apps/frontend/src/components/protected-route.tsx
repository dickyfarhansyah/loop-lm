import { Navigate, Outlet } from "react-router-dom"
import { useSession, useSignout } from "@/hooks/use-auth"
import { useAuthSettings, useGeneralSettings } from "@/features/settings/hooks/use-settings"
import { useAppLogo } from "@/hooks/use-app-logo"
import { Button } from "@/components/ui/button"
import { LoaderCircle } from "lucide-react"

function ProtectedRoute() {
  const { data: user, isLoading, isError } = useSession()
  const { data: authSettings } = useAuthSettings()
  const { data: generalSettings } = useGeneralSettings()
  const { mutate: signout } = useSignout()
  const { logogram } = useAppLogo()
  const appName = generalSettings?.webui_name || ""

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <LoaderCircle className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }

  if (isError || !user) {
    localStorage.removeItem("token")
    return <Navigate to="/auth/login" replace />
  }


  if (user.role === "pending") {
    const title = authSettings?.pending_user_overlay_title || "Aktivasi Akun Tertunda"
    const content = authSettings?.pending_user_overlay_content ||
      "Status akun Anda saat ini sedang menunggu aktivasi. Untuk mengakses WebUI, hubungi administrator. Admin dapat mengelola status pengguna dari Panel Admin."
    const adminEmail = authSettings?.show_admin_details ? (authSettings?.admin_email || "admin@example.com") : null

    return (
      <div className="h-screen w-full flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-3">
          <div className="flex justify-center mb-6">
            {logogram && <img src={logogram} alt="Logo" className="max-w-xs container h-20 object-cover" />}
          </div>
          <h1 className="text-2xl  text-foreground">{title}</h1>
          <h1 className="text-xl  text-foreground">Hubungi Admin untuk Akses {appName}</h1>


          <p className="text-muted-foreground leading-relaxed">
            {content}
          </p>

          {adminEmail && (
            <p className="text-sm font-medium">
              Admin: <span className="text-primary">({adminEmail})</span>
            </p>
          )}

          <div className="flex flex-col gap-3 pt-4 items-center">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Periksa Lagi
            </Button>
            <Button variant="link" className="text-muted-foreground" onClick={() => signout()}>
              Keluar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <Outlet />
}

export { ProtectedRoute }