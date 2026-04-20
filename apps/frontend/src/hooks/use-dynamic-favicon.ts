import { useEffect } from "react"
import { useGeneralSettings } from "@/features/settings/hooks/use-settings"

export function useDynamicFavicon() {
    const { data: generalSettings } = useGeneralSettings()
    const iconUrl = (generalSettings as any)?.logo_icon_url || null

    useEffect(() => {
        if (!iconUrl) return
        let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
        if (!link) {
            link = document.createElement("link")
            link.rel = "icon"
            document.head.appendChild(link)
        }
        link.href = iconUrl
    }, [iconUrl])
}
