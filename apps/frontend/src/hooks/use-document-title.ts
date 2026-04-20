import { useEffect } from "react"
import { useMatches } from "react-router-dom"
import { useGeneralSettings } from "@/features/settings/hooks/use-settings"

interface RouteHandle {
  title?: string
}

function useDocumentTitle() {
  const matches = useMatches()
  const { data: generalSettings } = useGeneralSettings()
  const appName = generalSettings?.webui_name || ""

  useEffect(() => {
    const match = [...matches].reverse().find((m) => (m.handle as RouteHandle)?.title)
    const title = (match?.handle as RouteHandle)?.title
    document.title = title ? `${title} | ${appName}` : appName
  }, [matches, appName])
}

export { useDocumentTitle }
