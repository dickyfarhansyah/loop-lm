import * as React from "react"
import { useNavigate, useLocation, Outlet } from "react-router-dom"
import { Loader2 } from "lucide-react"

import { useSetupStatus } from "@/hooks/use-setup-status"

function SetupGuard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data, isLoading } = useSetupStatus()

  React.useEffect(() => {
    if (isLoading) return

    
    if (data?.setupRequired && location.pathname !== "/setup") {
      navigate("/setup", { replace: true })
    }
  }, [data, isLoading, location.pathname, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  
  if (data?.setupRequired && location.pathname !== "/setup") {
    return null
  }

  return <Outlet />
}

export { SetupGuard }
