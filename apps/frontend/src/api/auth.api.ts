import { api } from "@/lib/axios"
import type { User, AuthResponse, SigninRequest, SignupRequest } from "@/types"

export const authApi = {
  signup: (data: SignupRequest) =>
    api.post<AuthResponse>("/api/v1/auths/signup", data),

  signin: (data: SigninRequest) =>
    api.post<AuthResponse>("/api/v1/auths/signin", data),

  signout: () =>
    api.post("/api/v1/auths/signout"),

  getSession: () =>
    api.get<User>("/api/v1/auths/session"),

  getMe: () =>
    api.get<User>("/api/v1/users/me"),

  updateMe: (data: Partial<User>) =>
    api.put<User>("/api/v1/users/me", data),
}
