import { useTranslation } from "react-i18next"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeleteGroupDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    groupName: string
    onConfirm: () => void
    isPending?: boolean
}

function DeleteGroupDialog({ open, onOpenChange, groupName, onConfirm, isPending }: DeleteGroupDialogProps) {
    const { t } = useTranslation()
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t("adminPage.deleteGroupTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t("adminPage.deleteGroupDesc", { name: groupName })}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>{t("adminPage.cancelBtn")}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isPending ? t("adminPage.deletingBtn") : t("adminPage.deleteBtn")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export { DeleteGroupDialog }
