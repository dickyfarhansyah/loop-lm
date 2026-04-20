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

interface DeleteUserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userName: string
    onConfirm: () => void
    isPending?: boolean
}

function DeleteUserDialog({ open, onOpenChange, userName, onConfirm, isPending }: DeleteUserDialogProps) {
    const { t } = useTranslation()
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t("adminPage.deleteUserTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t("adminPage.deleteUserDesc", { name: userName })}
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

export { DeleteUserDialog }
