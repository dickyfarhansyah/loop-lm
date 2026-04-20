import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { FormField } from "@/components/ui/form-field"
import { signupSchema, type SignupFormData } from "../schemas/signup-schema"

interface SignupFormProps {
  onSubmit: (data: SignupFormData) => void
  isLoading?: boolean
}

function SignupForm({ onSubmit, isLoading = false }: SignupFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormField
        label="Nama"
        htmlFor="name"
        error={errors.name?.message}
      >
        <Input
          id="name"
          placeholder="Masukkan Nama Anda"
          {...register("name")}
        />
      </FormField>

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
        {isLoading ? "Memuat..." : "Daftar"}
      </Button>
    </form>
  )
}

export { SignupForm }
export type { SignupFormData }
