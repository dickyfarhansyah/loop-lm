import * as React from "react"
import { ImageIcon, Upload, X } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const API_URL = import.meta.env.VITE_API_URL ?? ""

interface ImageUploadProps {
    value: string
    onChange: (url: string) => void
    placeholder?: string
    className?: string
}

export function ImageUpload({ value, onChange, placeholder, className }: ImageUploadProps) {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = React.useState(false)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            toast.error("Only image files are allowed")
            return
        }

        const formData = new FormData()
        formData.append("file", file)

        try {
            setUploading(true)
            const res = await api.post<{ id: string }>("/api/v1/files", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            const publicUrl = `${API_URL}/api/v1/files/${res.data.id}/public`
            onChange(publicUrl)
        } catch {
            toast.error("Failed to upload image")
        } finally {
            setUploading(false)
            // reset so same file can be re-uploaded
            if (inputRef.current) inputRef.current.value = ""
        }
    }

    return (
        <div className={cn("flex items-center gap-3", className)}>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />

            {value ? (
                <div className="relative group shrink-0">
                    <img
                        src={value}
                        alt="Preview"
                        className="h-12 w-auto max-w-32 rounded-md border object-contain bg-muted"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                    <button
                        type="button"
                        onClick={() => onChange("")}
                        className="absolute -top-1.5 -right-1.5 hidden group-hover:flex items-center justify-center size-4 rounded-full bg-destructive text-destructive-foreground"
                    >
                        <X className="size-2.5" />
                    </button>
                </div>
            ) : (
                <div className="flex h-12 w-20 items-center justify-center rounded-md border border-dashed bg-muted">
                    <ImageIcon className="size-5 text-muted-foreground" />
                </div>
            )}

            <div className="flex flex-col gap-1">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => inputRef.current?.click()}
                >
                    <Upload className="size-3.5 mr-1.5" />
                    {uploading ? "Uploading…" : placeholder ?? "Upload Image"}
                </Button>
                {value && (
                    <p className="text-xs text-muted-foreground truncate max-w-48">{value}</p>
                )}
            </div>
        </div>
    )
}
