import { api } from "@/lib/axios"

export interface SystemPromptData {
    prompt: string
    name?: string
    enabled: boolean
}

export interface ModelPrompt {
    id: string
    modelId: string
    userId: string
    name: string
    prompt: string
    enabled: boolean
    isDefault: boolean
    createdAt: Date
    updatedAt: Date
}

export interface CreateModelPromptData {
    name: string
    prompt: string
    enabled?: boolean
    isDefault?: boolean
}

export interface UpdateModelPromptData {
    name?: string
    prompt?: string
    enabled?: boolean
    isDefault?: boolean
}

export interface ModelPromptSummary {
    [modelId: string]: {
        hasPrompt: boolean
        enabled: boolean
        promptCount: number
    }
}

export interface ModelConfigData {
    description?: string
    temperature?: number
    maxTokens?: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
    capabilities?: {
        vision?: boolean
        fileUpload?: boolean
        fileContext?: boolean
        webSearch?: boolean
        imageGeneration?: boolean
        codeInterpreter?: boolean
        usage?: boolean
        citations?: boolean
        statusUpdates?: boolean
        builtinTools?: boolean
    }
    defaultFeatures?: {
        webSearch?: boolean
        imageGeneration?: boolean
        codeInterpreter?: boolean
    }
    ttsVoice?: string
    tags?: string[]
}

export const modelApi = {
    
    getModelPromptsSummary: async () => {
        const response = await api.get<ModelPromptSummary>(
            `/api/v1/model-prompts/summary`
        )
        return response.data
    },

    
    getSystemPrompt: async (modelId: string) => {
        const response = await api.get<SystemPromptData>(
            `/api/v1/models/${encodeURIComponent(modelId)}/system-prompt`
        )
        return response.data
    },

    
    updateSystemPrompt: async (modelId: string, data: SystemPromptData) => {
        const response = await api.put<SystemPromptData>(
            `/api/v1/models/${encodeURIComponent(modelId)}/system-prompt`,
            data
        )
        return response.data
    },

    
    getModelConfig: async (modelId: string) => {
        const response = await api.get<ModelConfigData>(
            `/api/v1/models/${encodeURIComponent(modelId)}/config`
        )
        return response.data
    },

    
    updateModelConfig: async (modelId: string, data: ModelConfigData) => {
        const response = await api.put<ModelConfigData>(
            `/api/v1/models/${encodeURIComponent(modelId)}/config`,
            data
        )
        return response.data
    },

    
    getModelPrompts: async (modelId: string) => {
        const response = await api.get<ModelPrompt[]>(
            `/api/v1/model-prompts/models/${encodeURIComponent(modelId)}/prompts`
        )
        return response.data
    },

    
    createModelPrompt: async (modelId: string, data: CreateModelPromptData) => {
        const response = await api.post<ModelPrompt>(
            `/api/v1/model-prompts/models/${encodeURIComponent(modelId)}/prompts`,
            data
        )
        return response.data
    },

    
    getModelPromptById: async (promptId: string) => {
        const response = await api.get<ModelPrompt>(
            `/api/v1/model-prompts/prompts/${promptId}`
        )
        return response.data
    },

    
    updateModelPrompt: async (promptId: string, data: UpdateModelPromptData) => {
        const response = await api.put<ModelPrompt>(
            `/api/v1/model-prompts/prompts/${promptId}`,
            data
        )
        return response.data
    },

    
    deleteModelPrompt: async (promptId: string) => {
        await api.delete(`/api/v1/model-prompts/prompts/${promptId}`)
    },

    
    setDefaultPrompt: async (promptId: string) => {
        const response = await api.post<ModelPrompt>(
            `/api/v1/model-prompts/prompts/${promptId}/set-default`
        )
        return response.data
    },

    
    toggleModelEnabled: async (modelId: string, isEnabled: boolean) => {
        const response = await api.put(
            `/api/v1/models/${encodeURIComponent(modelId)}/toggle-enabled`,
            { isEnabled }
        )
        return response.data
    },

    
    setModelDefault: async (modelId: string) => {
        const response = await api.post(
            `/api/v1/models/${encodeURIComponent(modelId)}/set-default`
        )
        return response.data
    },

    
    toggleModelPinned: async (modelId: string) => {
        const response = await api.post(
            `/api/v1/models/${encodeURIComponent(modelId)}/toggle-pinned`
        )
        return response.data
    },
}