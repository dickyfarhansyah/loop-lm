import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { useUpdateGroup } from "@/hooks"
import type { Group } from "@/api"

const schema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface EditGroupDialogProps {
    group: Group | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

function EditGroupDialog({ group, open, onOpenChange }: EditGroupDialogProps) {
    const { t } = useTranslation()
    const { mutate: updateGroup, isPending } = useUpdateGroup()

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        values: {
            name: group?.name ?? "",
            description: group?.description ?? "",
        },
    })

    React.useEffect(() => {
        if (!open) reset()
    }, [open, reset])

    const onSubmit = (data: FormData) => {
        if (!group) return
        updateGroup({ id: group.id, data }, {
            onSuccess: () => {
                toast.success("Group updated")
                onOpenChange(false)
            },
            onError: () => toast.error("Failed to update group"),
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t("adminPage.editGroupTitle")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="edit-group-name">{t("adminPage.labelName")}</Label>
                        <Input id="edit-group-name" {...register("name")} />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="edit-group-desc">{t("adminPage.labelDescription")}</Label>
                        <Textarea
                            id="edit-group-desc"
                            {...register("description")}
                            placeholder={t("adminPage.descPlaceholder")}
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {t("adminPage.cancelBtn")}
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? t("adminPage.savingBtn") : t("adminPage.saveChangesBtn")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export { EditGroupDialog }
