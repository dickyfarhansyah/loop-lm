
export type ProviderType = 'openai' | 'ollama' | 'anthropic' | 'azure' | 'google' | 'custom';
export type AuthType = 'bearer' | 'api_key' | 'basic' | 'none';
export type ConnectionType = 'internal' | 'external';

export interface Connection {
  id: string;
  userId: string;
  name: string;
  type: ConnectionType;
  providerType: ProviderType;
  url: string;
  authType: AuthType;
  authValue?: string | null;
  headers?: Record<string, string> | null;
  prefixId?: string | null;
  modelIds?: string[] | null;
  tags?: string[] | null;
  isEnabled: boolean;
  isDefault: boolean;
  priority: number;
  meta?: Record<string, unknown> | null;
  lastVerifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectionResponse {
  id: string;
  name: string;
  type: ConnectionType;
  providerType: ProviderType;
  url: string;
  authType: AuthType;
  isEnabled: boolean;
  isDefault: boolean;
  priority: number;
  meta?: Record<string, unknown> | null;
  lastVerifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConnectionRequest {
  name: string;
  type?: ConnectionType;
  providerType: ProviderType;
  url: string;
  authType?: AuthType;
  authValue?: string;
  headers?: Record<string, string>;
  prefixId?: string;
  modelIds?: string[];
  tags?: string[];
  isEnabled?: boolean;
  isDefault?: boolean;
  priority?: number;
  meta?: Record<string, unknown>;
}

export interface UpdateConnectionRequest {
  name?: string;
  type?: ConnectionType;
  providerType?: ProviderType;
  url?: string;
  authType?: AuthType;
  authValue?: string;
  headers?: Record<string, string>;
  prefixId?: string;
  modelIds?: string[];
  tags?: string[];
  isEnabled?: boolean;
  isDefault?: boolean;
  priority?: number;
  meta?: Record<string, unknown>;
}
