import { api } from "@/lib/axios"
import type { User } from "@/types"

export interface Group {
    id: string
    name: string
    description?: string | null
    permissions?: Record<string, boolean> | null
    memberCount?: number
    createdAt: string
    updatedAt: string
}

export interface CreateGroupRequest {
    name: string
    description?: string
    permissions?: Record<string, boolean>
}

export const groupApi = {
    getAll: () =>
        api.get<Group[]>("/api/v1/groups"),

    getById: (id: string) =>
        api.get<Group>(`/api/v1/groups/${id}`),

    create: (data: CreateGroupRequest) =>
        api.post<Group>("/api/v1/groups", data),

    update: (id: string, data: Partial<CreateGroupRequest>) =>
        api.put<Group>(`/api/v1/groups/${id}`, data),

    delete: (id: string) =>
        api.delete(`/api/v1/groups/${id}`),

    getMembers: (groupId: string) =>
        api.get<User[]>(`/api/v1/groups/${groupId}/members`),

    addMember: (groupId: string, userId: string) =>
        api.post(`/api/v1/groups/${groupId}/members`, { userId }),

    removeMember: (groupId: string, userId: string) =>
        api.delete(`/api/v1/groups/${groupId}/members/${userId}`),

    getUserGroups: (userId: string) =>
        api.get<Group[]>(`/api/v1/groups/users/${userId}`),

    getAllMemberships: () =>
        api.get<{ userId: string; group: Group }[]>(`/api/v1/groups/memberships`),
}
