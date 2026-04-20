import { Loader2, Link } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useTranslation } from "react-i18next"

interface ChatShareDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    shareUrl: string
    onCopyLink: () => void
    onUnshare: () => void
    isUnsharePending?: boolean
}

function ChatShareDialog({
    open,
    onOpenChange,
    shareUrl,
    onCopyLink,
    onUnshare,
    isUnsharePending = false,
}: ChatShareDialogProps) {
    const { t } = useTranslation()
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-6">
                <DialogHeader className="space-y-3">
                    <DialogTitle>{t("chatPage.shareTitle")}</DialogTitle>
                    <DialogDescription>
                        {t("chatPage.shareDesc")}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg my-4">
                    <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="flex-1 bg-transparent text-sm outline-none truncate"
                    />
                    <Button variant="ghost" size="sm" onClick={onCopyLink} className="shrink-0">
                        <Link className="size-4" />
                    </Button>
                </div>

                <div className="flex justify-between gap-3 pt-2">
                    <Button variant="destructive" onClick={onUnshare} disabled={isUnsharePending}>
                        {isUnsharePending && <Loader2 className="size-4 animate-spin mr-2" />}
                        {t("chatPage.unshareButton")}
                    </Button>
                    <Button onClick={onCopyLink} className="gap-2">
                        <Link className="size-4" />
                        {t("chatPage.copyLinkButton")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export { ChatShareDialog }
