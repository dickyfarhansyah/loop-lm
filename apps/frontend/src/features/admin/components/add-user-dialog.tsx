import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Info, RefreshCw } from "lucide-react"
import { AxiosError } from "axios"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { PasswordInput } from "@/components/ui/password-input"
import { useRegisterUser } from "@/hooks/use-auth"

const addUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type AddUserFormData = z.infer<typeof addUserSchema>

interface AddUserFormProps {
  onSuccess?: () => void
}

function AddUserForm({ onSuccess }: AddUserFormProps) {
  const { t } = useTranslation()
  const { mutate: registerUser, isPending } = useRegisterUser()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })

  const generatePassword = () => {
    const length = 12
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+"
    let password = ""
    for (let i = 0, n = charset.length; i < length; ++i) {
      password += charset.charAt(Math.floor(Math.random() * n))
    }
    setValue("password", password, { shouldValidate: true, shouldDirty: true })
    toast.success("Password generated successfully")
  }

  const onFormSubmit = (data: AddUserFormData) => {
    registerUser(data, {
      onSuccess: () => {
        toast.success("User created successfully!")
        reset()
        onSuccess?.()
      },
      onError: (error: unknown) => {
        const message = error instanceof AxiosError
          ? error.response?.data?.error || error.response?.data?.message || "Failed to create user"
          : error instanceof Error ? error.message : "Failed to create user"
        toast.error(message)
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label className="text-muted-foreground">{t("adminPage.labelName")}</Label>
        <Input
          {...register("name")}
          placeholder={t("adminPage.namePlaceholder")}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground">{t("adminPage.labelEmail")}</Label>
        <Input
          {...register("email")}
          type="email"
          placeholder={t("adminPage.emailPlaceholder")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-muted-foreground">{t("adminPage.labelPassword")}</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs text-primary hover:bg-transparent hover:text-primary/80"
            onClick={generatePassword}
          >
            <RefreshCw className="size-3 mr-1" />
            {t("adminPage.generatePassword")}
          </Button>
        </div>
        <PasswordInput
          {...register("password")}
          placeholder={t("adminPage.passwordPlaceholder")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="rounded-full px-6" disabled={isPending}>
          {isPending ? t("adminPage.savingBtn") : t("adminPage.saveBtn")}
        </Button>
      </div>
    </form>
  )
}

const importCsvSchema = z.object({
  file: z.instanceof(File, { message: "CSV file is required" }),
})

type ImportCsvFormData = z.infer<typeof importCsvSchema>

interface ImportCsvFormProps {
  onSubmit?: (file: File) => void
}

function ImportCsvForm({ onSubmit }: ImportCsvFormProps) {
  const { t } = useTranslation()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const {
    setValue,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ImportCsvFormData>({
    resolver: zodResolver(importCsvSchema),
  })

  const file = useWatch({ control, name: "file" })

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setValue("file", selectedFile)
    }
  }

  const onFormSubmit = (data: ImportCsvFormData) => {
    onSubmit?.(data.file)
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={handleClick}
        className="w-full border-2 border-dashed cursor-pointer border-muted-foreground/30 rounded-xl py-6 text-center text-muted-foreground hover:border-muted-foreground transition-colors"
      >
        {file ? file.name : t("adminPage.clickToSelectCsv")}
      </button>
      {errors.file && (
        <p className="text-sm text-destructive">{errors.file.message}</p>
      )}

      <p className="text-sm text-muted-foreground flex items-start gap-2">
        <Info className="size-4 mt-0.5 shrink-0" />
        <span>
          {t("adminPage.csvInfo")}{" "}
          <a href="#" className="underline">
            {t("adminPage.csvDownloadLink")}
          </a>
        </span>
      </p>

      <div className="flex justify-end">
        <Button type="submit" className="rounded-full px-6" disabled={!file}>
          {t("adminPage.saveBtn")}
        </Button>
      </div>
    </form>
  )
}

interface AddUserDialogProps {
  children: React.ReactNode
}

function AddUserDialog({ children }: AddUserDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md p-5">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t("adminPage.addUserTitle")}</h2>

          <Tabs defaultValue="form">
            <TabsList>
              <TabsTrigger value="form">{t("adminPage.tabForm")}</TabsTrigger>
              <TabsTrigger value="import">{t("adminPage.tabImportCsv")}</TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="mt-4">
              <AddUserForm onSuccess={() => setOpen(false)} />
            </TabsContent>

            <TabsContent value="import" className="mt-4">
              <ImportCsvForm onSubmit={() => setOpen(false)} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { AddUserDialog, AddUserForm, ImportCsvForm }
