import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { Info } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/axios"
import { useSetupStatus } from "@/hooks/use-setup-status"

interface SetupFormData {
  app_name: string
  logo_url?: string
  logo_icon_url?: string
  name: string
  email: string
  password: string
  confirm_password: string
}

function SetupPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: setupStatus } = useSetupStatus()

  useEffect(() => {
    if (setupStatus && !setupStatus.setupRequired) {
      navigate("/auth/login", { replace: true })
    }
  }, [setupStatus, navigate])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SetupFormData>({
    defaultValues: {
      app_name: "",
      logo_url: "",
      logo_icon_url: "",
      name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  })

  const onSubmit = async (data: SetupFormData) => {
    try {
      await api.post("/api/v1/setup", {
        name: data.name,
        email: data.email,
        password: data.password,
        app_name: data.app_name,
        logo_url: data.logo_url || "",
        logo_icon_url: data.logo_icon_url || "",
      })
      await queryClient.invalidateQueries({ queryKey: ["setup-status"] })
      toast.success("Akun admin berhasil dibuat!")
      navigate("/auth/login", { replace: true })
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error(err.response?.data?.error || "Gagal membuat akun admin")
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-semibold text-foreground">
            Get started
          </h1>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            <Info className="size-4" />
            This application does not make any external connections, and your data stays securely on your locally hosted server.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="app_name" className="text-foreground font-medium">
              Application Name
            </Label>
            <Input
              id="app_name"
              type="text"
              {...register("app_name", { required: "Nama aplikasi harus diisi" })}
              placeholder="My AI App"
            />
            {errors.app_name && (
              <p className="text-sm text-destructive">{errors.app_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo_url" className="text-foreground font-medium">
              Logo URL <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="logo_url"
              type="url"
              {...register("logo_url")}
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo_icon_url" className="text-foreground font-medium">
              Icon URL <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="logo_icon_url"
              type="url"
              {...register("logo_icon_url")}
              placeholder="https://example.com/icon.png"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground font-medium">
              Name
            </Label>
            <Input
              id="name"
              type="text"
              {...register("name", { required: "Nama harus diisi" })}

              placeholder="Your name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              {...register("email", {
                required: "Email harus diisi",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Email tidak valid",
                },
              })}

              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              {...register("password", {
                required: "Password harus diisi",
                minLength: {
                  value: 4,
                  message: "Password minimal 4 karakter",
                },
              })}
              placeholder="••••"
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password" className="text-foreground font-medium">
              Confirm Password
            </Label>
            <Input
              id="confirm_password"
              type="password"
              {...register("confirm_password", {
                required: "Konfirmasi password harus diisi",
                validate: (val) => val === watch("password") || "Password tidak cocok",
              })}
              placeholder="••••"
            />
            {errors.confirm_password && (
              <p className="text-sm text-destructive">{errors.confirm_password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"

          >
            {isSubmitting ? "Creating..." : "Create Admin Account"}
          </Button>
        </form>
      </div>
    </div>
  )
}

export { SetupPage }
