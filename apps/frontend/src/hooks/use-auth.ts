import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { authApi } from "@/api"
import type { SigninRequest, SignupRequest } from "@/types"

export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
  me: () => [...authKeys.all, "me"] as const,
}

export function useSession() {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: () => authApi.getSession().then((res) => res.data),
    retry: false,
  })
}

export function useMe() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => authApi.getMe().then((res) => res.data),
  })
}

export function useSignin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SigninRequest) => authApi.signin(data),
    onSuccess: (res) => {
      queryClient.setQueryData(authKeys.session(), res.data.user)
    },
  })
}

export function useSignup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SignupRequest) => authApi.signup(data),
    onSuccess: (res) => {
      queryClient.setQueryData(authKeys.session(), res.data.user)
    },
  })
}

export function useSignout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authApi.signout(),
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

export function useUpdateMe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: (res) => {
      queryClient.setQueryData(authKeys.me(), res.data)
      queryClient.setQueryData(authKeys.session(), res.data)
    },
  })
}

export function useRegisterUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SignupRequest) => authApi.signup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}
