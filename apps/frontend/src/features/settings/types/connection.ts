export type ProviderType = "openai" | "ollama" | "anthropic" | "azure" | "google" | "custom"
export type AuthType = "bearer" | "api_key" | "basic" | "none"
export type ConnectionType = "internal" | "external"

export interface Connection {
  id: string
  name: string
  providerType: ProviderType
  url: string
  type: ConnectionType
  authType: AuthType
  authValue?: string
  headers?: Record<string, string>
  prefixId?: string
  modelIds?: string[]
  tags?: string[]
  isDefault?: boolean
  isEnabled: boolean
  priority?: number
  createdAt: string
  updatedAt: string
}

export interface CreateConnectionRequest {
  name: string
  providerType: ProviderType
  url: string
  type?: ConnectionType
  authType?: AuthType
  authValue?: string
  headers?: Record<string, string>
  prefixId?: string
  modelIds?: string[]
  tags?: string[]
  isDefault?: boolean
}

export interface UpdateConnectionRequest {
  name?: string
  url?: string
  authType?: AuthType
  authValue?: string
  headers?: Record<string, string>
  prefixId?: string
  modelIds?: string[]
  tags?: string[]
  isEnabled?: boolean
  isDefault?: boolean
  priority?: number
}

export interface VerifyConnectionResponse {
  success: boolean
  message: string
  models?: string[]
}

export interface ConnectionModelsResponse {
  models: string[]
}

export interface ConnectionStatusResponse {
  configured: boolean
  message: string
}
