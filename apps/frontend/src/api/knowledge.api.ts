import { api } from "@/lib/axios"

const BASE = "/api/v1/knowledge"

export interface Knowledge {
    id: string
    userId: string
    name: string
    description: string
    chunkingStrategy: string
    data: Record<string, unknown>
    fileCount: number
    createdAt: string
    updatedAt: string
}

export interface ChunkingStrategyOption {
    value: string
    label: string
    description: string
}

export type EmbedStatus = "pending" | "indexing" | "indexed" | "failed"

export interface KnowledgeFile {
    id: string
    filename: string
    meta: {
        mimetype?: string
        size?: number
        status?: string
    }
    embedStatus: EmbedStatus
    embedError: string | null
    chunkCount: number
    createdAt: string
    updatedAt: string
}

export interface KnowledgeStats {
    totalFiles: number
    totalChunks: number
    byStatus: Record<EmbedStatus, number>
}

export interface ChunkPreview {
    totalChunks: number
    strategy: string
    preview: Array<{ index: number; text: string; length: number }>
}

export interface QueryResult {
    id: string
    text: string
    metadata: Record<string, unknown>
    distance: number
}

export const knowledgeApi = {
    list: async (): Promise<Knowledge[]> => {
        const { data } = await api.get<Knowledge[]>(BASE)
        return data
    },

    get: async (id: string): Promise<Knowledge> => {
        const { data } = await api.get<Knowledge>(`${BASE}/${id}`)
        return data
    },

    create: async (payload: { name: string; description?: string; chunkingStrategy?: string }): Promise<Knowledge> => {
        const { data } = await api.post<Knowledge>(BASE, payload)
        return data
    },

    update: async (id: string, payload: { name?: string; description?: string; chunkingStrategy?: string }): Promise<Knowledge> => {
        const { data } = await api.put<Knowledge>(`${BASE}/${id}`, payload)
        return data
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`${BASE}/${id}`)
    },

    listStrategies: async (): Promise<ChunkingStrategyOption[]> => {
        const { data } = await api.get<ChunkingStrategyOption[]>(`${BASE}/strategies`)
        return data
    },

    listFiles: async (id: string): Promise<KnowledgeFile[]> => {
        const { data } = await api.get<KnowledgeFile[]>(`${BASE}/${id}/files`)
        return data
    },

    uploadFile: async (
        knowledgeId: string,
        file: File,
        onUploadProgress?: (progress: number) => void,
    ): Promise<KnowledgeFile> => {
        const form = new FormData()
        form.append("file", file)
        const { data } = await api.post<KnowledgeFile>(
            `${BASE}/${knowledgeId}/files/upload`,
            form,
            {
                onUploadProgress: (event) => {
                    if (event.total) {
                        const pct = Math.round((event.loaded / event.total) * 100)
                        onUploadProgress?.(pct)
                    }
                },
            },
        )
        return data
    },

    addExistingFile: async (knowledgeId: string, fileId: string): Promise<KnowledgeFile> => {
        const { data } = await api.post<KnowledgeFile>(`${BASE}/${knowledgeId}/files`, { fileId })
        return data
    },

    removeFile: async (knowledgeId: string, fileId: string): Promise<void> => {
        await api.delete(`${BASE}/${knowledgeId}/files/${fileId}`)
    },

    reindexFile: async (knowledgeId: string, fileId: string): Promise<{ message: string }> => {
        const { data } = await api.post<{ message: string }>(`${BASE}/${knowledgeId}/files/${fileId}/reindex`)
        return data
    },

    batchAddFiles: async (knowledgeId: string, fileIds: string[]): Promise<KnowledgeFile[]> => {
        const { data } = await api.post<KnowledgeFile[]>(`${BASE}/${knowledgeId}/files/batch`, { fileIds })
        return data
    },

    previewChunks: async (knowledgeId: string, fileId: string): Promise<ChunkPreview> => {
        const { data } = await api.get<ChunkPreview>(`${BASE}/${knowledgeId}/files/${fileId}/preview`)
        return data
    },

    stats: async (knowledgeId: string): Promise<KnowledgeStats> => {
        const { data } = await api.get<KnowledgeStats>(`${BASE}/${knowledgeId}/stats`)
        return data
    },

    query: async (knowledgeId: string, query: string, nResults = 5, fileIds?: string[]): Promise<QueryResult[]> => {
        const { data } = await api.post<{ results: QueryResult[] }>(
            `${BASE}/${knowledgeId}/query`,
            { query, nResults, fileIds },
        )
        return data.results
    },
}
