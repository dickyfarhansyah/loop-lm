import * as React from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { api } from "@/lib/axios"

interface SetupStatus {
  setupRequired: boolean
  userCount: number
}

interface SetupContextType {
  setupRequired: boolean
  isLoading: boolean
}

const SetupContext = React.createContext<SetupContextType>({
  setupRequired: false,
  isLoading: true,
})

function SetupProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [setupRequired, setSetupRequired] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const { data } = await api.get<SetupStatus>("/api/v1/setup/status")
        setSetupRequired(data.setupRequired)

        
        if (data.setupRequired && location.pathname !== "/setup") {
          navigate("/setup", { replace: true })
        }

        
        if (!data.setupRequired && location.pathname === "/setup") {
          navigate("/auth/login", { replace: true })
        }
      } catch {
        
        setSetupRequired(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkSetupStatus()
  }, [navigate, location.pathname])

  return (
    <SetupContext.Provider value={{ setupRequired, isLoading }}>
      {children}
    </SetupContext.Provider>
  )
}

function useSetup() {
  return React.useContext(SetupContext)
}

export { SetupProvider, useSetup }
