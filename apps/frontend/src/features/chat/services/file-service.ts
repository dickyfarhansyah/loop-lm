import { api } from "@/lib/axios"

const BASE_URL = "/api/v1/files"

export interface ParsedDocument {
  text: string
  metadata: {
    pages?: number
    wordCount: number
    charCount: number
    format: string
  }
}

export interface UploadedFile {
  id: string
  filename: string
  path: string
  meta: {
    mimetype: string
    size: number
  }
}

export interface ParseDocumentResponse {
  file: UploadedFile
  parsed: ParsedDocument
}

export const fileService = {
  
  parseDocument: async (file: File): Promise<ParseDocumentResponse> => {
    const formData = new FormData()
    formData.append("file", file)

    const { data } = await api.post<ParseDocumentResponse>(`${BASE_URL}/parse`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return data
  },

  
  upload: async (file: File): Promise<UploadedFile> => {
    const formData = new FormData()
    formData.append("file", file)

    const { data } = await api.post<UploadedFile>(BASE_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return data
  },
}

export const SUPPORTED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/plain",
]

export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]

export function isImageFile(file: File): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(file.type)
}

export function isDocumentFile(file: File): boolean {
  return SUPPORTED_DOCUMENT_TYPES.includes(file.type)
}

export function isSupportedFile(file: File): boolean {
  return isImageFile(file) || isDocumentFile(file)
}
