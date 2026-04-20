import { useNavigate } from "react-router-dom"
import { AxiosError } from "axios"
import { toast } from "sonner"

import { SignupForm, type SignupFormData } from "./components/signup-form"
import { useSignup } from "@/hooks"
import { useAppLogo } from "@/hooks/use-app-logo"
import { Button } from "@/components/ui/button"

function SignupPage() {
  const navigate = useNavigate()
  const { mutate: signup, isPending } = useSignup()
  const { logoFull, logogram } = useAppLogo()

  const handleSignup = (data: SignupFormData) => {
    signup(
      { name: data.name, email: data.email, password: data.password },
      {
        onSuccess: () => {
          toast.success("Pendaftaran berhasil! Anda telah masuk.")
          navigate("/")
        },
        onError: (error) => {
          const message = error instanceof AxiosError
            ? error.response?.data?.error || error.response?.data?.message || "Pendaftaran gagal. Silakan coba lagi."
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
            Buat Akun Baru 🚀
          </h1>

          <SignupForm onSubmit={handleSignup} isLoading={isPending} />

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-normal text-primary"
                onClick={() => navigate("/auth/login")}
              >
                Masuk sekarang
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export { SignupPage }
