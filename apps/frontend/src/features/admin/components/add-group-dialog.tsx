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
import { useCreateGroup } from "@/hooks"

const schema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddGroupDialogProps {
    children: React.ReactNode
}

function AddGroupDialog({ children }: AddGroupDialogProps) {
    const { t } = useTranslation()
    const [open, setOpen] = React.useState(false)
    const { mutate: createGroup, isPending } = useCreateGroup()

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { name: "", description: "" },
    })

    const onSubmit = (data: FormData) => {
        createGroup(data, {
            onSuccess: () => {
                toast.success("Group created")
                reset()
                setOpen(false)
            },
            onError: () => toast.error("Failed to create group"),
        })
    }

    return (
        <>
            <span onClick={() => setOpen(true)}>{children}</span>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md p-5">
                    <DialogHeader>
                        <DialogTitle>{t("adminPage.createGroupTitle")}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="group-name">{t("adminPage.labelName")}</Label>
                            <Input id="group-name" {...register("name")} placeholder={t("adminPage.groupNamePlaceholder")} />
                            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="group-desc">{t("adminPage.labelDescription")}</Label>
                            <Textarea
                                id="group-desc"
                                {...register("description")}
                                placeholder={t("adminPage.descPlaceholder")}
                                rows={3}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                {t("adminPage.cancelBtn")}
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? t("adminPage.creatingBtn") : t("adminPage.createGroupBtn")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}

export { AddGroupDialog }
