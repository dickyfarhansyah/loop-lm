import { api } from "@/lib/axios"
import type {
  Connection,
  CreateConnectionRequest,
  UpdateConnectionRequest,
  VerifyConnectionResponse,
  ConnectionModelsResponse,
  ConnectionStatusResponse,
} from "../types"

const BASE_URL = "/api/v1/connections"

export const connectionService = {
  
  list: async (): Promise<Connection[]> => {
    const { data } = await api.get<Connection[]>(BASE_URL)
    return data
  },

  
  get: async (id: string): Promise<Connection> => {
    const { data } = await api.get<Connection>(`${BASE_URL}/${id}`)
    return data
  },

  
  create: async (request: CreateConnectionRequest): Promise<Connection> => {
    const { data } = await api.post<Connection>(BASE_URL, request)
    return data
  },

  
  update: async (id: string, request: UpdateConnectionRequest): Promise<Connection> => {
    const { data } = await api.put<Connection>(`${BASE_URL}/${id}`, request)
    return data
  },

  
  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`)
  },

  
  verify: async (id: string): Promise<VerifyConnectionResponse> => {
    const { data } = await api.post<VerifyConnectionResponse>(`${BASE_URL}/${id}/verify`)
    return data
  },

  
  getModels: async (id: string): Promise<ConnectionModelsResponse> => {
    const { data } = await api.get<ConnectionModelsResponse>(`${BASE_URL}/${id}/models`)
    return data
  },

  
  checkStatus: async (): Promise<ConnectionStatusResponse> => {
    const { data } = await api.get<ConnectionStatusResponse>(`${BASE_URL}/status/check`)
    return data
  },
}
