import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { settingsService } from "../services/settings-service"
import type { TasksSettings, UISettings, GeneralSettings, AuthSettings, AudioSettings } from "../types/settings"

const SETTINGS_KEY = ["settings"]

export function useAllSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: settingsService.getAll,
  })
}

export function useGeneralSettings() {
  return useQuery({
    queryKey: [...SETTINGS_KEY, "general"],
    queryFn: settingsService.getGeneral,
  })
}

export function useUpdateGeneralSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (settings: Partial<GeneralSettings>) => settingsService.updateGeneral(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...SETTINGS_KEY, "general"] })
    },
  })
}

export function useAuthSettings() {
  return useQuery({
    queryKey: [...SETTINGS_KEY, "auth"],
    queryFn: settingsService.getAuth,
  })
}

export function useUpdateAuthSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (settings: Partial<AuthSettings>) => settingsService.updateAuth(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...SETTINGS_KEY, "auth"] })
    },
  })
}

export function useResetAuthSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => settingsService.resetAuth(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...SETTINGS_KEY, "auth"] })
    },
  })
}

export function useTasksSettings() {
  return useQuery({
    queryKey: [...SETTINGS_KEY, "tasks"],
    queryFn: settingsService.getTasks,
  })
}

export function useUpdateTasksSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (settings: Partial<TasksSettings>) => settingsService.updateTasks(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...SETTINGS_KEY, "tasks"] })
    },
  })
}

export function useUISettings() {
  return useQuery({
    queryKey: [...SETTINGS_KEY, "ui"],
    queryFn: settingsService.getUI,
  })
}

export function useUpdateUISettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (settings: Partial<UISettings>) => settingsService.updateUI(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...SETTINGS_KEY, "ui"] })
    },
  })
}

export function useAudioSettings() {
  return useQuery({
    queryKey: [...SETTINGS_KEY, "audio"],
    queryFn: settingsService.getAudio,
  })
}

export function useUpdateAudioSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (settings: Partial<AudioSettings>) => settingsService.updateAudio(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...SETTINGS_KEY, "audio"] })
    },
  })
}
