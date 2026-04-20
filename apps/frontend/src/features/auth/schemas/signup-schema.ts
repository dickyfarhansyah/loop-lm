import { z } from "zod"

export const signupSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
})

export type SignupFormData = z.infer<typeof signupSchema>
