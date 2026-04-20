import { api } from "@/lib/axios"
import type { TasksSettings, UISettings, GeneralSettings, AuthSettings, AudioSettings } from "../types/settings"

const BASE_URL = "/api/v1/settings"

export const settingsService = {
  
  getAll: async (): Promise<Record<string, Record<string, unknown>>> => {
    const { data } = await api.get(BASE_URL)
    return data
  },

  
  getByCategory: async <T>(category: string): Promise<T> => {
    const { data } = await api.get<T>(`${BASE_URL}/${category}`)
    return data
  },

  
  updateCategory: async <T>(category: string, settings: Partial<T>): Promise<T> => {
    const { data } = await api.put<T>(`${BASE_URL}/${category}`, settings)
    return data
  },

  
  resetCategory: async (category: string): Promise<{ message: string }> => {
    const { data } = await api.delete<{ message: string }>(`${BASE_URL}/${category}`)
    return data
  },

  
  getGeneral: async (): Promise<GeneralSettings> => {
    return settingsService.getByCategory<GeneralSettings>("general")
  },

  updateGeneral: async (settings: Partial<GeneralSettings>): Promise<GeneralSettings> => {
    return settingsService.updateCategory<GeneralSettings>("general", settings)
  },

  
  getAuth: async (): Promise<AuthSettings> => {
    return settingsService.getByCategory<AuthSettings>("auth")
  },

  updateAuth: async (settings: Partial<AuthSettings>): Promise<AuthSettings> => {
    return settingsService.updateCategory<AuthSettings>("auth", settings)
  },

  resetAuth: async (): Promise<{ message: string }> => {
    return settingsService.resetCategory("auth")
  },

  
  getTasks: async (): Promise<TasksSettings> => {
    return settingsService.getByCategory<TasksSettings>("tasks")
  },

  updateTasks: async (settings: Partial<TasksSettings>): Promise<TasksSettings> => {
    return settingsService.updateCategory<TasksSettings>("tasks", settings)
  },

  
  getUI: async (): Promise<UISettings> => {
    return settingsService.getByCategory<UISettings>("ui")
  },

  updateUI: async (settings: Partial<UISettings>): Promise<UISettings> => {
    return settingsService.updateCategory<UISettings>("ui", settings)
  },

  
  getAudio: async (): Promise<AudioSettings> => {
    return settingsService.getByCategory<AudioSettings>("audio")
  },

  updateAudio: async (settings: Partial<AudioSettings>): Promise<AudioSettings> => {
    return settingsService.updateCategory<AudioSettings>("audio", settings)
  },
}
