import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { FormField } from "@/components/ui/form-field"
import { loginSchema, type LoginFormData } from "../schemas/login-schema"

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void
  isLoading?: boolean
}

function LoginForm({ onSubmit, isLoading = false }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormField
        label="Email"
        htmlFor="email"
        error={errors.email?.message}
      >
        <Input
          id="email"
          type="email"
          placeholder="Masukkan Email Anda"
          {...register("email")}
        />
      </FormField>

      <FormField
        label="Kata sandi"
        htmlFor="password"
        error={errors.password?.message}
      >
        <PasswordInput
          id="password"
          placeholder="Masukkan Kata Sandi Anda"
          {...register("password")}
        />
      </FormField>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? "Memuat..." : "Masuk"}
      </Button>
    </form>
  )
}

export { LoginForm }
export type { LoginFormData }
