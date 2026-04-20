export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "user" | "pending"
  profileImageUrl?: string
  bio?: string
  isMaster?: boolean
  settings?: Record<string, unknown> | null
  lastActiveAt?: string
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface SignupRequest {
  email: string
  password: string
  name: string
}

export interface SigninRequest {
  email: string
  password: string
}
