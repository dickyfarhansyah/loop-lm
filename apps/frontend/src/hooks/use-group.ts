import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { groupApi, type CreateGroupRequest, type Group } from "@/api"

export const groupKeys = {
    all: ["groups"] as const,
    lists: () => [...groupKeys.all, "list"] as const,
    detail: (id: string) => [...groupKeys.all, id] as const,
    members: (id: string) => [...groupKeys.all, id, "members"] as const,
    userGroups: (userId: string) => [...groupKeys.all, "user", userId] as const,
    memberships: () => [...groupKeys.all, "memberships"] as const,
}

export function useGroups() {
    return useQuery({
        queryKey: groupKeys.lists(),
        queryFn: () => groupApi.getAll().then((res) => res.data),
    })
}

export function useGroup(id: string) {
    return useQuery({
        queryKey: groupKeys.detail(id),
        queryFn: () => groupApi.getById(id).then((res) => res.data),
        enabled: !!id,
    })
}

export function useGroupMembers(groupId: string) {
    return useQuery({
        queryKey: groupKeys.members(groupId),
        queryFn: () => groupApi.getMembers(groupId).then((res) => res.data),
        enabled: !!groupId,
    })
}

export function useCreateGroup() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: CreateGroupRequest) => groupApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: groupKeys.lists() })
        },
    })
}

export function useUpdateGroup() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateGroupRequest> }) =>
            groupApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: groupKeys.lists() })
        },
    })
}

export function useDeleteGroup() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: groupApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: groupKeys.lists() })
        },
    })
}

export function useAddGroupMember() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
            groupApi.addMember(groupId, userId),
        onSuccess: (_, { groupId, userId }) => {
            queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) })
            queryClient.invalidateQueries({ queryKey: groupKeys.userGroups(userId) })
            queryClient.invalidateQueries({ queryKey: groupKeys.memberships() })
            queryClient.invalidateQueries({ queryKey: groupKeys.lists() })
        },
    })
}

export function useRemoveGroupMember() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
            groupApi.removeMember(groupId, userId),
        onSuccess: (_, { groupId, userId }) => {
            queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) })
            queryClient.invalidateQueries({ queryKey: groupKeys.userGroups(userId) })
            queryClient.invalidateQueries({ queryKey: groupKeys.memberships() })
            queryClient.invalidateQueries({ queryKey: groupKeys.lists() })
        },
    })
}

export function useUserGroups(userId: string) {
    return useQuery({
        queryKey: groupKeys.userGroups(userId),
        queryFn: () => groupApi.getUserGroups(userId).then((res) => res.data),
        enabled: !!userId,
    })
}

export function useAllGroupMemberships() {
    return useQuery({
        queryKey: groupKeys.memberships(),
        queryFn: () => groupApi.getAllMemberships().then((res) => res.data),
    })
}

export function useAssignUserToGroup() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
            groupApi.addMember(groupId, userId),
        onSuccess: (_, { groupId, userId }) => {
            queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) })
            queryClient.invalidateQueries({ queryKey: groupKeys.userGroups(userId) })
            queryClient.invalidateQueries({ queryKey: groupKeys.memberships() })
            queryClient.invalidateQueries({ queryKey: groupKeys.lists() })
        },
    })
}

export function useUnassignUserFromGroup() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
            groupApi.removeMember(groupId, userId),
        onSuccess: (_, { groupId, userId }) => {
            queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) })
            queryClient.invalidateQueries({ queryKey: groupKeys.userGroups(userId) })
            queryClient.invalidateQueries({ queryKey: groupKeys.memberships() })
            queryClient.invalidateQueries({ queryKey: groupKeys.lists() })
        },
    })
}

export type { Group }
