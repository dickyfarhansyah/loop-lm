import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ModelSelector } from "./model-selector"
import { useTranslation } from "react-i18next"

interface ChatRegenDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedModel: string
    onModelChange: (model: string) => void
    onConfirm: () => void
}

function ChatRegenDialog({
    open,
    onOpenChange,
    selectedModel,
    onModelChange,
    onConfirm,
}: ChatRegenDialogProps) {
    const { t } = useTranslation()
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm p-6">
                <DialogHeader>
                    <DialogTitle>{t("chatPage.regenTitle")}</DialogTitle>
                    <DialogDescription>
                        {t("chatPage.regenDesc")}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-3">
                    <ModelSelector value={selectedModel} onChange={onModelChange} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t("chatPage.cancel")}
                    </Button>
                    <Button onClick={onConfirm} disabled={!selectedModel}>
                        {t("chatPage.regenConfirm")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export { ChatRegenDialog }
