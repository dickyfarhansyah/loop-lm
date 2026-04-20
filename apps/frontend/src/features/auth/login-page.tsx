import { useNavigate } from "react-router-dom"
import { AxiosError } from "axios"
import { toast } from "sonner"

import { LoginForm, type LoginFormData } from "./components/login-form"
import { useSignin } from "@/hooks"
import { useAuthSettings } from "../settings/hooks/use-settings"
import { useAppLogo } from "@/hooks/use-app-logo"
import { Button } from "@/components/ui/button"

interface LoginPageProps { }

function LoginPage({ }: LoginPageProps) {
  const navigate = useNavigate()
  const { mutate: signin, isPending } = useSignin()
  const { data: settings } = useAuthSettings()
  const { logoFull, logogram } = useAppLogo()

  const handleLogin = (data: LoginFormData) => {
    signin(
      { email: data.email, password: data.password },
      {
        onSuccess: () => {
          toast.success("Login berhasil!")
          navigate("/")
        },
        onError: (error) => {
          const message = error instanceof AxiosError
            ? error.response?.data?.error || error.response?.data?.message || "Login gagal. Silakan coba lagi."
            : error.message
          toast.error(message)
        },
      }
    )
  }

  return (
    <div className="min-h-screen w-full bg-background">
      {logogram && (
        <div className="absolute top-4 left-4">
          <img src={logogram} alt="Logo" className="h-10 w-auto" />
        </div>
      )}

      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">

          {logoFull && (
            <div className="h-32 overflow-hidden w-full">
              <img
                src={logoFull}
                alt="Logo"
                className="w-full h-full object-cover object-center"
              />
            </div>
          )}

          <h1 className="text-xl font-normal text-center text-foreground">
            Halo! Selamat Datang Kembali 👋
          </h1>

          <LoginForm onSubmit={handleLogin} isLoading={isPending} />

          {settings?.enable_signup && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Belum punya akun?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal text-primary"
                  onClick={() => navigate("/auth/signup")}
                >
                  Daftar sekarang
                </Button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { LoginPage }
