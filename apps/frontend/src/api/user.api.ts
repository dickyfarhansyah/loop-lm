import { api } from "@/lib/axios"
import type { User } from "@/types"

export interface CreateUserRequest {
  name: string
  email: string
  password: string
  role: string
}

export const userApi = {
  getAll: () =>
    api.get<User[]>("/api/v1/users"),

  getById: (id: string) =>
    api.get<User>(`/api/v1/users/${id}`),

  create: (data: CreateUserRequest) =>
    api.post<User>("/api/v1/users", data),

  update: (id: string, data: Partial<User>) =>
    api.put<User>(`/api/v1/users/${id}`, data),

  delete: (id: string) =>
    api.delete(`/api/v1/users/${id}`),
}
