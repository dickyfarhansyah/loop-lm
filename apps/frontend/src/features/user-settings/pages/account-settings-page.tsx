import * as React from "react"
import { useTranslation } from "react-i18next"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Camera, Eye, EyeOff, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useMe, useUpdateMe } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface UserSettings {
  profile?: {
    gender?: string
    birthDate?: string
    webhookUrl?: string
  }
  [key: string]: unknown
}

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bio: z.string().optional(),
  gender: z.string().optional(),
  birthDate: z.string().optional(),
  webhookUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  profileImageUrl: z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

function AccountSettingsPage() {
  const { t } = useTranslation()
  const { data: user } = useMe()
  const { mutate: updateMe } = useUpdateMe()

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false)
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [birthDatePopoverOpen, setBirthDatePopoverOpen] = React.useState(false)

  
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      bio: "",
      gender: "",
      birthDate: "",
      webhookUrl: "",
      profileImageUrl: "",
    },
  })

  
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  
  React.useEffect(() => {
    if (user) {
      const settings = user.settings as UserSettings

      profileForm.reset({
        name: user.name || "",
        bio: user.bio || "",
        gender: settings?.profile?.gender || "",
        birthDate: settings?.profile?.birthDate || "",
        webhookUrl: settings?.profile?.webhookUrl || "",
        profileImageUrl: user.profileImageUrl || "",
      })
    }
  }, [user, profileForm])

  const onProfileSubmit = (data: ProfileFormData) => {
    const currentSettings = (user?.settings as UserSettings | null) || {}

    const newSettings: UserSettings = {
      ...currentSettings,
      profile: {
        ...(currentSettings.profile || {}),
        gender: data.gender,
        birthDate: data.birthDate,
        webhookUrl: data.webhookUrl,
      },
    }

    console.log("Submitting profile with avatar length:", data.profileImageUrl?.length || 0)
    console.log("Profile data:", {
      ...data,
      profileImageUrl: data.profileImageUrl ? data.profileImageUrl.substring(0, 50) + "..." : undefined
    })

    updateMe(
      {
        name: data.name,
        bio: data.bio || undefined,
        profileImageUrl: data.profileImageUrl || undefined,
        settings: newSettings,
      },
      {
        onSuccess: () => {
          toast.success(t("account.saved"))
        },
        onError: (error) => {
          console.error("Save profile error:", error)
          toast.error(t("account.saveFailed"))
        },
      }
    )
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("account.avatarTooLarge"))
      return
    }

    
    if (!file.type.startsWith("image/")) {
      toast.error(t("account.avatarInvalidType"))
      return
    }

    
    const reader = new FileReader()
    reader.onloadend = () => {
      const img = new Image()
      img.onload = () => {
        
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          toast.error(t("account.avatarLoadFailed"))
          return
        }

        
        const maxSize = 512
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
        }

        
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        
        const base64String = canvas.toDataURL("image/jpeg", 0.85)

        console.log("Avatar base64 length:", base64String.length)
        console.log("Avatar base64 preview:", base64String.substring(0, 100))

        profileForm.setValue("profileImageUrl", base64String, { shouldDirty: true })
        toast.success(t("account.avatarLoaded"))
      }
      img.onerror = () => {
        toast.error(t("account.avatarLoadFailed"))
      }
      img.src = reader.result as string
    }
    reader.onerror = () => {
      toast.error(t("account.avatarLoadFailed"))
    }
    reader.readAsDataURL(file)
  }

  const onPasswordSubmit = (data: PasswordFormData) => {
    
    console.log("Password change:", data)
    toast.info(t("account.passwordChangePending"))
    setIsPasswordDialogOpen(false)
    passwordForm.reset()
  }

  const getInitials = (name: string) => {
    if (!name) return "??"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  
  const watchedName = useWatch({
    control: profileForm.control,
    name: "name",
    defaultValue: "",
  })

  const watchedAvatar = useWatch({
    control: profileForm.control,
    name: "profileImageUrl",
    defaultValue: "",
  })

  return (
    <div className="w-full ">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">{t("account.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("account.description")}</p>
      </div>

      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
        
        <div className="flex items-start gap-6">
          <div className="relative">
            <Avatar className="size-20">
              <AvatarImage src={watchedAvatar} alt={watchedName} />
              <AvatarFallback>{getInitials(watchedName)}</AvatarFallback>
            </Avatar>
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
            >
              <Camera className="size-4" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>
          <div className="flex-1 space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="name">{t("account.name")}</Label>
              <Input
                id="name"
                {...profileForm.register("name")}
                placeholder={t("account.namePlaceholder")}
              />
              {profileForm.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {profileForm.formState.errors.name.message}
                </p>
              )}
            </div>

            
            <div className="space-y-2">
              <Label htmlFor="bio">{t("account.bio")}</Label>
              <Textarea
                id="bio"
                {...profileForm.register("bio")}
                placeholder={t("account.bioPlaceholder")}
                className="min-h-20 resize-none"
              />
              {profileForm.formState.errors.bio && (
                <p className="text-sm text-destructive">
                  {profileForm.formState.errors.bio.message}
                </p>
              )}
            </div>
          </div>
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="space-y-2">
            <Label htmlFor="gender">{t("account.gender")}</Label>
            <Controller
              name="gender"
              control={profileForm.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder={t("account.genderPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prefer-not-to-say">{t("account.genderPreferNot")}</SelectItem>
                    <SelectItem value="male">{t("account.genderMale")}</SelectItem>
                    <SelectItem value="female">{t("account.genderFemale")}</SelectItem>
                    <SelectItem value="other">{t("account.genderOther")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {profileForm.formState.errors.gender && (
              <p className="text-sm text-destructive">
                {profileForm.formState.errors.gender.message}
              </p>
            )}
          </div>

          
          <div className="space-y-2">
            <Label htmlFor="birthDate">{t("account.birthDate")}</Label>
            <Controller
              name="birthDate"
              control={profileForm.control}
              render={({ field }) => {
                
                const dateValue = field.value ? new Date(field.value) : undefined

                return (
                  <Popover open={birthDatePopoverOpen} onOpenChange={setBirthDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="birthDate"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 size-4" />
                        {field.value ? new Date(field.value).toLocaleDateString() : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateValue}
                        defaultMonth={dateValue}
                        captionLayout="dropdown"
                        onSelect={(date) => {
                          
                          field.onChange(date ? date.toISOString().split('T')[0] : "")
                          setBirthDatePopoverOpen(false)
                        }}
                        fromYear={1900}
                        toYear={new Date().getFullYear()}
                      />
                    </PopoverContent>
                  </Popover>
                )
              }}
            />
            {profileForm.formState.errors.birthDate && (
              <p className="text-sm text-destructive">
                {profileForm.formState.errors.birthDate.message}
              </p>
            )}
          </div>
        </div>

        
        <div className="space-y-2">
          <Label htmlFor="webhookUrl">{t("account.webhookUrl")}</Label>
          <Input
            id="webhookUrl"
            type="url"
            {...profileForm.register("webhookUrl")}
            placeholder={t("account.webhookUrlPlaceholder")}
          />
          {profileForm.formState.errors.webhookUrl && (
            <p className="text-sm text-destructive">
              {profileForm.formState.errors.webhookUrl.message}
            </p>
          )}
        </div>

        
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{t("account.changePassword")}</h3>
              <p className="text-sm text-muted-foreground">{t("account.changePasswordDesc")}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPasswordDialogOpen(true)}
            >
              {t("account.show")}
            </Button>
          </div>
        </div>

        
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={profileForm.formState.isSubmitting}>
            {profileForm.formState.isSubmitting ? t("settings.saving") : t("settings.save")}
          </Button>
        </div>
      </form>

      
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="p-5">
          <DialogHeader>
            <DialogTitle>{t("account.changePassword")}</DialogTitle>
            <DialogDescription>{t("account.changePasswordDialogDesc")}</DialogDescription>
          </DialogHeader>

          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
            <div className="space-y-4 py-4">
              
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t("account.currentPassword")}</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    {...passwordForm.register("currentPassword")}
                    placeholder={t("account.currentPasswordPlaceholder")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("account.newPassword")}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    {...passwordForm.register("newPassword")}
                    placeholder={t("account.newPasswordPlaceholder")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("account.confirmPassword")}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    {...passwordForm.register("confirmPassword")}
                    placeholder={t("account.confirmPasswordPlaceholder")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsPasswordDialogOpen(false)
                  passwordForm.reset()
                }}
              >
                {t("dataControls.cancel")}
              </Button>
              <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                {passwordForm.formState.isSubmitting ? t("account.updating") : t("account.updatePassword")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { AccountSettingsPage }

