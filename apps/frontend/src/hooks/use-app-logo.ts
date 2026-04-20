import { useGeneralSettings } from "@/features/settings/hooks/use-settings"

/**
 * Returns logo URLs from DB settings, or null if not configured.
 * Components should render the img conditionally: {logoFull && <img src={logoFull} />}
 */
export function useAppLogo() {
    const { data: generalSettings } = useGeneralSettings()
    return {
        logoFull: (generalSettings as any)?.logo_url || null,
        logogram: (generalSettings as any)?.logo_icon_url || null,
    }
}
