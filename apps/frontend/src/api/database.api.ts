import { api } from "@/lib/axios"

const BASE_URL = "/api/v1/database"

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

export const databaseApi = {

    downloadDatabase: async () => {
        const response = await api.get(`${BASE_URL}/download`, { responseType: "blob" })
        const now = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
        downloadBlob(response.data as Blob, `app-db-${now}.db`)
    },


    exportConfig: async () => {
        const response = await api.get(`${BASE_URL}/export/config`, { responseType: "blob" })
        const now = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
        downloadBlob(response.data as Blob, `app-config-${now}.json`)
    },


    importConfig: async (file: File) => {
        const formData = new FormData()
        formData.append("file", file)
        const response = await api.post(`${BASE_URL}/import/config`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        })
        return response.data
    },


    exportChats: async () => {
        const response = await api.get(`${BASE_URL}/export/chats`, { responseType: "blob" })
        const now = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
        downloadBlob(response.data as Blob, `app-chats-${now}.json`)
    },


    exportUsers: async () => {
        const response = await api.get(`${BASE_URL}/export/users`, { responseType: "blob" })
        const now = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
        downloadBlob(response.data as Blob, `app-users-${now}.json`)
    },
}
