import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { settingsService } from "@/features/settings/services/settings-service"

/**
 * Reads the saved primary_color from UI settings and applies it as a
 * CSS custom property on <html>. Falls back to the CSS-file default when
 * the stored value is empty.
 */
export function useThemeColor() {
    const { data: uiSettings } = useQuery({
        queryKey: ["settings", "ui"],
        queryFn: settingsService.getUI,
        staleTime: 5 * 60 * 1000,
    })

    useEffect(() => {
        const color = (uiSettings as any)?.primary_color
        if (color) {
            document.documentElement.style.setProperty("--primary", color)
        } else {
            document.documentElement.style.removeProperty("--primary")
        }
    }, [(uiSettings as any)?.primary_color])
}
