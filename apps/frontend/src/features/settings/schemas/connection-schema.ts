import { z } from "zod"

export const connectionFormSchema = z.object({
  url: z.string().min(1, "URL wajib diisi"),
  authType: z.enum(["bearer", "api_key", "basic", "none"]),
  authValue: z.string().optional(),
  headers: z.string().optional().refine(
    (val) => {
      if (!val || val.trim() === "") return true
      try {
        JSON.parse(val)
        return true
      } catch {
        return false
      }
    },
    { message: "Headers harus berupa JSON yang valid" }
  ),
  prefixId: z.string().optional(),
  modelIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isEnabled: z.boolean(),
})

export type ConnectionFormValues = z.infer<typeof connectionFormSchema>
