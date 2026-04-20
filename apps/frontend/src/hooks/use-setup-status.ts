import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/axios"

interface SetupStatus {
  setupRequired: boolean
  userCount: number
}

export function useSetupStatus() {
  return useQuery({
    queryKey: ["setup-status"],
    queryFn: async () => {
      const { data } = await api.get<SetupStatus>("/api/v1/setup/status")
      return data
    },
    staleTime: 1000 * 60 * 5, 
    retry: false,
  })
}
