import { Construction } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

interface UnderDevelopmentAlertProps {
    className?: string
}

export function UnderDevelopmentAlert({ className }: UnderDevelopmentAlertProps) {
    const { t } = useTranslation()

    return (
        <div
            className={cn(
                "flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30 px-4 py-3 text-yellow-800 dark:text-yellow-300",
                className
            )}
        >
            <Construction className="size-5 shrink-0" />
            <div className="text-sm">
                <span className="font-semibold">{t("common.underDevelopmentTitle")}</span>
                {" — "}
                {t("common.underDevelopmentDesc")}
            </div>
        </div>
    )
}
