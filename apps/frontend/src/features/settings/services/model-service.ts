import { api } from "@/lib/axios"
import type { ModelsResponse } from "../types"

const BASE_URL = "/api/v1/models"

export const modelService = {
  
  getAvailableModels: async (): Promise<ModelsResponse> => {
    const { data } = await api.get<ModelsResponse>(`${BASE_URL}/available`)
    return data
  },
}
