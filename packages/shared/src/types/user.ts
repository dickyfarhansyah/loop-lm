
export interface User {
  id: string;
  email: string;
  username?: string | null;
  role: 'pending' | 'user' | 'admin';
  name: string;
  profileImageUrl: string;
  profileBannerImageUrl?: string | null;
  bio?: string | null;
  settings?: Record<string, unknown> | null;
  oauth?: Record<string, unknown> | null;
  isMaster: boolean;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Auth {
  id: string;
  email: string;
  password: string;
  active: boolean;
}

export interface ApiKey {
  id: string;
  userId: string;
  key: string;
  data?: Record<string, unknown> | null;
  expiresAt?: Date | null;
  lastUsedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  profileImageUrl: string;
  isMaster: boolean;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: UserResponse;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
}

export interface SetupRequest {
  name: string;
  email: string;
  password: string;
}

export interface SetupStatus {
  setupRequired: boolean;
  userCount: number;
}
