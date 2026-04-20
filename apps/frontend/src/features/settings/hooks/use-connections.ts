import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { connectionService } from "../services"
import type { CreateConnectionRequest, UpdateConnectionRequest } from "../types"

const CONNECTIONS_KEY = ["connections"]

export function useConnections() {
  return useQuery({
    queryKey: CONNECTIONS_KEY,
    queryFn: connectionService.list,
  })
}

export function useConnection(id: string) {
  return useQuery({
    queryKey: [...CONNECTIONS_KEY, id],
    queryFn: () => connectionService.get(id),
    enabled: !!id,
  })
}

export function useConnectionStatus() {
  return useQuery({
    queryKey: [...CONNECTIONS_KEY, "status"],
    queryFn: connectionService.checkStatus,
  })
}

export function useConnectionModels(id: string) {
  return useQuery({
    queryKey: [...CONNECTIONS_KEY, id, "models"],
    queryFn: () => connectionService.getModels(id),
    enabled: !!id,
  })
}

export function useCreateConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateConnectionRequest) => connectionService.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONNECTIONS_KEY })
    },
  })
}

export function useUpdateConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateConnectionRequest }) =>
      connectionService.update(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONNECTIONS_KEY })
    },
  })
}

export function useDeleteConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => connectionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONNECTIONS_KEY })
    },
  })
}

export function useVerifyConnection() {
  return useMutation({
    mutationFn: (id: string) => connectionService.verify(id),
  })
}
