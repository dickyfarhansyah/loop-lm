import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X } from "lucide-react"
import { AxiosError } from "axios"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PasswordInput } from "@/components/ui/password-input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useUpdateUser } from "@/hooks"
import type { User } from "@/types"

const editUserSchema = z.object({
  role: z.string().min(1, "Role is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().optional(),
})

type EditUserFormData = z.infer<typeof editUserSchema>

interface EditUserDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
  const { t, i18n } = useTranslation()
  const { mutate: updateUser, isPending } = useUpdateUser()

  const {
    register,
    control,
    handleSubmit,
    setValue,

    formState: { errors },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    values: {
      role: user?.role || "user",
      name: user?.name || "",
      email: user?.email || "",
      password: "",
    },
  })

  const role = useWatch({ control, name: "role" })

  const onFormSubmit = (data: EditUserFormData) => {
    if (!user) return

    const updateData: Partial<User> = {
      role: data.role as "user" | "admin" | "pending",
      name: data.name,
      email: data.email,
    }

    if (data.password && data.password.length > 0) {
      (updateData as Record<string, unknown>).password = data.password
    }

    updateUser(
      { id: user.id, data: updateData },
      {
        onSuccess: () => {
          toast.success("User updated successfully!")
          onOpenChange(false)
        },
        onError: (error: unknown) => {
          const message =
            error instanceof AxiosError
              ? error.response?.data?.error ||
              error.response?.data?.message ||
              "Failed to update user"
              : error instanceof Error
                ? error.message
                : "Failed to update user"
          toast.error(message)
        },
      }
    )
  }

  if (!user) return null

  const createdAtFormatted = new Date(user.createdAt).toLocaleDateString(i18n.language, {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6" hideCloseButton>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{t("adminPage.editUserTitle")}</h2>
          <button
            type="button"
            className="size-8 rounded-md border border-input flex items-center justify-center hover:bg-accent transition-colors"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={user.profileImageUrl} alt={user.name} />
              <AvatarFallback className="text-xl">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-lg">{user.name}</p>
              <p className="text-sm text-muted-foreground">
                {t("adminPage.createdAt", { date: createdAtFormatted })}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground text-sm">{t("adminPage.labelRole")}</Label>
            {user.isMaster ? (
              <Badge className="cursor-not-allowed">{t("adminPage.roleMasterAdmin")}</Badge>
            ) : (
              <Select
                value={role}
                onValueChange={(value) => setValue("role", value)}
              >
                <SelectTrigger className="border-0 border-b rounded-none px-0 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{t("adminPage.roleUser")}</SelectItem>
                  <SelectItem value="admin">{t("adminPage.roleAdmin")}</SelectItem>
                  <SelectItem value="pending">{t("adminPage.rolePending")}</SelectItem>
                </SelectContent>
              </Select>
            )}
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground text-sm">{t("adminPage.labelName")}</Label>
            <Input
              {...register("name")}
              className="border-0 border-b rounded-none px-0 focus-visible:ring-0"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground text-sm">{t("adminPage.labelEmail")}</Label>
            <Input
              {...register("email")}
              type="email"
              className="border-0 border-b rounded-none px-0 focus-visible:ring-0"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground text-sm">{t("adminPage.labelNewPassword")}</Label>
            <PasswordInput
              {...register("password")}
              placeholder={t("adminPage.passwordPlaceholder")}
              className="border-0 border-b rounded-none px-0 focus-visible:ring-0"
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="rounded-full px-6"
              disabled={isPending}
            >
              {isPending ? t("adminPage.savingBtn") : t("adminPage.saveBtn")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { EditUserDialog }
