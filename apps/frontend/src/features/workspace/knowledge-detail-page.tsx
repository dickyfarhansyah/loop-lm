import { useState, useRef, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    ArrowLeft,
    Upload,
    Trash2,
    Loader2,
    FileText,
    File,
    Search,
    ChevronRight,
    RefreshCw,
    Eye,
    X,
    Download,
    AlertCircle,
    CheckCircle2,
    Clock,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { knowledgeApi, type KnowledgeFile, type QueryResult, type EmbedStatus } from "@/api/knowledge.api"
import { api } from "@/lib/axios"

interface PdfPreviewModalProps {
    file: KnowledgeFile | null
    onClose: () => void
}

function PdfPreviewModal({ file, onClose }: PdfPreviewModalProps) {
    const [blobUrl, setBlobUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!file) {
            setBlobUrl(null)
            setError(null)
            return
        }
        setLoading(true)
        setError(null)
        setBlobUrl(null)
        api
            .get(`/api/v1/files/${file.id}/content`, { responseType: "blob" })
            .then((res) => {
                const url = URL.createObjectURL(res.data)
                setBlobUrl(url)
            })
            .catch(() => setError("Gagal memuat file"))
            .finally(() => setLoading(false))

        return () => {
            setBlobUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev)
                return null
            })
        }
    }, [file?.id])

    if (!file) return null

    const isPdf = file.filename.toLowerCase().endsWith(".pdf") ||
        file.meta?.mimetype === "application/pdf"

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="relative flex flex-col w-full max-w-4xl h-[90vh] bg-background rounded-2xl shadow-2xl overflow-hidden">

                <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
                    <FileText className="size-4 text-red-500 shrink-0" />
                    <span className="flex-1 text-sm font-medium truncate">{file.filename}</span>
                    <a
                        href={blobUrl ?? "#"}
                        download={file.filename}
                        className="inline-flex"
                        onClick={(e) => !blobUrl && e.preventDefault()}
                    >
                        <Button variant="ghost" size="icon" className="size-8 rounded-xl" title="Download" disabled={!blobUrl}>
                            <Download className="size-4" />
                        </Button>
                    </a>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-xl"
                        onClick={onClose}
                        title="Tutup"
                    >
                        <X className="size-4" />
                    </Button>
                </div>


                <div className="flex-1 overflow-hidden">
                    {loading && (
                        <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
                            <Loader2 className="size-5 animate-spin" />
                            <span className="text-sm">Memuat file…</span>
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}
                    {blobUrl && isPdf && (
                        <iframe
                            src={blobUrl}
                            title={file.filename}
                            className="w-full h-full border-0"
                        />
                    )}
                    {blobUrl && !isPdf && (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <FileText className="size-12 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">Preview tidak tersedia untuk tipe file ini.</p>
                            <a href={blobUrl} download={file.filename}>
                                <Button size="sm" className="rounded-xl">
                                    <Download className="size-3.5" /> Download
                                </Button>
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function EmbedStatusBadge({ status, chunkCount, error }: { status: EmbedStatus; chunkCount: number; error?: string | null }) {
    if (status === "indexed") {
        return (
            <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle2 className="size-3" />
                <span>{chunkCount} chunk{chunkCount !== 1 ? "s" : ""}</span>
            </span>
        )
    }
    if (status === "indexing") {
        return (
            <span className="inline-flex items-center gap-1 text-blue-500">
                <Loader2 className="size-3 animate-spin" />
                <span>Indexing…</span>
            </span>
        )
    }
    if (status === "failed") {
        return (
            <span className="inline-flex items-center gap-1 text-red-500" title={error ?? ""} >
                <AlertCircle className="size-3" />
                <span>Failed</span>
            </span>
        )
    }
    return (
        <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Clock className="size-3" />
            <span>Pending</span>
        </span>
    )
}

function FileIcon({ filename }: { filename: string }) {
    const ext = filename.split(".").pop()?.toLowerCase() ?? ""
    const isPdf = ext === "pdf"
    const isDoc = ["doc", "docx"].includes(ext)
    const isSheet = ["xls", "xlsx", "csv"].includes(ext)
    const color = isPdf
        ? "text-red-500"
        : isDoc
            ? "text-blue-500"
            : isSheet
                ? "text-green-500"
                : "text-gray-400"
    return <FileText className={`size-4 shrink-0 ${color}`} />
}

function formatBytes(bytes?: number) {
    if (!bytes) return ""
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string) {
    try {
        return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(iso))
    } catch {
        return iso
    }
}

interface FileRowProps {
    file: KnowledgeFile
    knowledgeId: string
    onRemoved: () => void
    onPreview: (file: KnowledgeFile) => void
}

function FileRow({ file, knowledgeId, onRemoved, onPreview }: FileRowProps) {
    const removeMutation = useMutation({
        mutationFn: () => knowledgeApi.removeFile(knowledgeId, file.id),
        onSuccess: () => {
            toast.success("File dihapus dari knowledge base")
            onRemoved()
        },
        onError: () => toast.error("Gagal menghapus file"),
    })

    const reindexMutation = useMutation({
        mutationFn: () => knowledgeApi.reindexFile(knowledgeId, file.id),
        onSuccess: () => toast.success("Re-indexing dimulai, harap tunggu sebentar"),
        onError: () => toast.error("Gagal memulai re-indexing"),
    })

    return (
        <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition group">
            <FileIcon filename={file.filename} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.filename}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {file.meta?.mimetype && (
                        <span>{file.meta.mimetype.split("/")[1]?.toUpperCase()}</span>
                    )}
                    {file.meta?.size && <span>{formatBytes(file.meta.size)}</span>}
                    <span>Added {formatDate(file.createdAt)}</span>
                    <EmbedStatusBadge
                        status={file.embedStatus ?? "pending"}
                        chunkCount={file.chunkCount ?? 0}
                        error={file.embedError}
                    />
                </div>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-xl opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                onClick={() => onPreview(file)}
                disabled={removeMutation.isPending || reindexMutation.isPending}
                title="Preview file"
            >
                <Eye className="size-3.5" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-xl opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                onClick={() => reindexMutation.mutate()}
                disabled={reindexMutation.isPending || removeMutation.isPending}
                title="Re-index file"
            >
                {reindexMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                ) : (
                    <RefreshCw className="size-3.5" />
                )}
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-xl opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => {
                    if (confirm(`Hapus "${file.filename}" dari knowledge base?`)) {
                        removeMutation.mutate()
                    }
                }}
                disabled={removeMutation.isPending || reindexMutation.isPending}
                title="Hapus file"
            >
                {removeMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                ) : (
                    <Trash2 className="size-3.5" />
                )}
            </Button>
        </div>
    )
}

interface QueryPanelProps {
    knowledgeId: string
}

function QueryPanel({ knowledgeId }: QueryPanelProps) {
    const [q, setQ] = useState("")
    const [results, setResults] = useState<QueryResult[]>([])
    const [loading, setLoading] = useState(false)

    async function handleQuery(e: React.FormEvent) {
        e.preventDefault()
        if (!q.trim()) return
        setLoading(true)
        try {
            const r = await knowledgeApi.query(knowledgeId, q.trim())
            setResults(r)
            if (r.length === 0) toast.info("Tidak ada hasil")
        } catch {
            toast.error("Gagal melakukan pencarian")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100/30 dark:border-gray-800/30 p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Search className="size-3.5" /> Uji Pencarian RAG
            </h2>
            <form onSubmit={handleQuery} className="flex gap-2 mb-4">
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Ketik pertanyaan untuk menguji pencarian…"
                    className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent outline-none focus:border-gray-400 dark:focus:border-gray-500 transition"
                />
                <Button
                    type="submit"
                    size="sm"
                    className="rounded-xl"
                    disabled={loading || !q.trim()}
                >
                    {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
                    Cari
                </Button>
            </form>

            {results.length > 0 && (
                <div className="space-y-2">
                    {results.map((r, i) => (
                        <div
                            key={r.id}
                            className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 text-xs space-y-1"
                        >
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <span className="font-medium text-foreground">#{i + 1}</span>
                                <span>{(r.metadata.filename as string) ?? "—"}</span>
                                <span className="ml-auto font-mono">
                                    {(1 - r.distance).toFixed(3)} relevance
                                </span>
                            </div>
                            <p className="text-foreground leading-relaxed line-clamp-4">{r.text}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function KnowledgeDetailPage() {
    const { knowledgeId } = useParams<{ knowledgeId: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const uploadInputRef = useRef<HTMLInputElement>(null)
    const [uploadQueue, setUploadQueue] = useState<
        { id: string; name: string; progress: number; status: "uploading" | "done" | "error" }[]
    >([])
    const [previewFile, setPreviewFile] = useState<KnowledgeFile | null>(null)

    const isUploading = uploadQueue.some((u) => u.status === "uploading")

    const {
        data: kb,
        isLoading: kbLoading,
    } = useQuery({
        queryKey: ["knowledge", knowledgeId],
        queryFn: () => knowledgeApi.get(knowledgeId!),
        enabled: !!knowledgeId,
    })

    const {
        data: files = [],
        isLoading: filesLoading,
        refetch: refetchFiles,
    } = useQuery({
        queryKey: ["knowledge", knowledgeId, "files"],
        queryFn: () => knowledgeApi.listFiles(knowledgeId!),
        enabled: !!knowledgeId,
        // Auto-poll while any file is still pending/indexing
        refetchInterval: (query) => {
            const data = query.state.data as KnowledgeFile[] | undefined
            const hasPending = data?.some((f) => f.embedStatus === "pending" || f.embedStatus === "indexing")
            return hasPending ? 3000 : false
        },
    })

    const {
        data: stats,
    } = useQuery({
        queryKey: ["knowledge", knowledgeId, "stats"],
        queryFn: () => knowledgeApi.stats(knowledgeId!),
        enabled: !!knowledgeId,
        refetchInterval: (query) => {
            const s = query.state.data
            const hasPending = s && (s.byStatus.pending > 0 || s.byStatus.indexing > 0)
            return hasPending ? 3000 : false
        },
    })

    const handleUpload = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFiles = Array.from(e.target.files ?? [])
            if (!selectedFiles.length || !knowledgeId) return
            e.target.value = ""

            // Add all files to the queue upfront
            const entries = selectedFiles.map((f) => ({
                id: `${f.name}-${Date.now()}-${Math.random()}`,
                name: f.name,
                progress: 0,
                status: "uploading" as const,
            }))
            setUploadQueue((prev) => [...prev, ...entries])

            // Upload sequentially
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i]
                const entryId = entries[i].id
                try {
                    await knowledgeApi.uploadFile(knowledgeId, file, (pct) => {
                        setUploadQueue((prev) =>
                            prev.map((u) => (u.id === entryId ? { ...u, progress: pct } : u))
                        )
                    })
                    setUploadQueue((prev) =>
                        prev.map((u) => (u.id === entryId ? { ...u, progress: 100, status: "done" } : u))
                    )
                    toast.success(`"${file.name}" berhasil ditambahkan`)
                    queryClient.invalidateQueries({ queryKey: ["knowledge", knowledgeId, "files"] })
                    queryClient.invalidateQueries({ queryKey: ["knowledge"] })
                } catch {
                    setUploadQueue((prev) =>
                        prev.map((u) => (u.id === entryId ? { ...u, status: "error" } : u))
                    )
                    toast.error(`Gagal mengunggah "${file.name}"`)
                } finally {
                    // Remove from queue after a short delay
                    setTimeout(() => {
                        setUploadQueue((prev) => prev.filter((u) => u.id !== entryId))
                    }, 1500)
                }
            }
        },
        [knowledgeId, queryClient],
    )

    if (kbLoading) {
        return (
            <div className="w-full h-full flex justify-center items-center py-20">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!kb) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <File className="size-10 text-muted-foreground" />
                <p className="text-muted-foreground">Knowledge base tidak ditemukan</p>
                <Button variant="link" size="sm" onClick={() => navigate("/workspace?tab=knowledge")}>
                    Kembali
                </Button>
            </div>
        )
    }

    return (
        <div className="w-full mx-auto px-4 py-6 space-y-6">

            <div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground hover:text-foreground mb-3 px-0"
                    onClick={() => navigate("/workspace")}
                >
                    <ArrowLeft className="size-3.5" /> Workspace
                    <ChevronRight className="size-3 opacity-40" />
                    <span className="text-foreground">Knowledge</span>
                </Button>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold">{kb.name}</h1>
                        {kb.description && (
                            <p className="text-sm text-muted-foreground mt-0.5">{kb.description}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl"
                            onClick={() => refetchFiles()}
                            title="Refresh"
                        >
                            <RefreshCw className="size-3.5" />
                        </Button>
                        <Button
                            size="sm"
                            className="rounded-xl"
                            disabled={isUploading}
                            onClick={() => uploadInputRef.current?.click()}
                        >
                            {isUploading ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Upload className="size-3.5" />
                            )}
                            Upload File
                        </Button>
                    </div>
                </div>
            </div>


            <input
                ref={uploadInputRef}
                type="file"
                hidden
                multiple
                accept=".pdf,.doc,.docx,.xlsx,.xls,.txt,.csv"
                onChange={handleUpload}
            />

            {/* Upload progress bars */}
            {uploadQueue.length > 0 && (
                <div className="space-y-2">
                    {uploadQueue.map((item) => (
                        <div key={item.id} className="rounded-xl border bg-muted/30 px-4 py-3 space-y-1.5">
                            <div className="flex items-center justify-between gap-2 text-sm">
                                <span className="truncate font-medium max-w-xs">{item.name}</span>
                                <span className="text-xs text-muted-foreground shrink-0">
                                    {item.status === "error"
                                        ? "Gagal"
                                        : item.status === "done"
                                            ? "Selesai"
                                            : `${item.progress}%`}
                                </span>
                            </div>
                            <Progress
                                value={item.progress}
                                className={`h-1.5 ${item.status === "error"
                                        ? "[&>div]:bg-red-500"
                                        : item.status === "done"
                                            ? "[&>div]:bg-green-500"
                                            : ""
                                    }`}
                            />
                        </div>
                    ))}
                </div>
            )}

            {stats && (
                <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground px-1">
                    <span className="font-medium text-foreground">{stats.totalFiles} file{stats.totalFiles !== 1 ? "s" : ""}</span>
                    <span>·</span>
                    <span>{stats.totalChunks.toLocaleString()} chunks</span>
                    {stats.byStatus.indexing > 0 && (
                        <span className="inline-flex items-center gap-1 text-blue-500">
                            <Loader2 className="size-3 animate-spin" /> {stats.byStatus.indexing} indexing
                        </span>
                    )}
                    {stats.byStatus.pending > 0 && (
                        <span className="inline-flex items-center gap-1 text-amber-500">
                            <Clock className="size-3" /> {stats.byStatus.pending} pending
                        </span>
                    )}
                    {stats.byStatus.failed > 0 && (
                        <span className="inline-flex items-center gap-1 text-red-500">
                            <AlertCircle className="size-3" /> {stats.byStatus.failed} failed
                        </span>
                    )}
                    {stats.byStatus.indexed > 0 && (
                        <span className="inline-flex items-center gap-1 text-green-500">
                            <CheckCircle2 className="size-3" /> {stats.byStatus.indexed} indexed
                        </span>
                    )}
                    <span>·</span>
                    <span className="capitalize">{kb.chunkingStrategy} strategy</span>
                </div>
            )}


            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100/30 dark:border-gray-800/30">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h2 className="text-sm font-semibold">
                        Dokumen{" "}
                        <span className="text-muted-foreground font-normal">{files.length}</span>
                    </h2>
                    {filesLoading && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
                </div>

                {files.length === 0 && !filesLoading ? (
                    <div
                        className="flex flex-col items-center justify-center py-16 gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 transition rounded-b-3xl"
                        onClick={() => uploadInputRef.current?.click()}
                    >
                        <Upload className="size-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                            Drag & drop atau klik untuk upload file
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                            PDF, DOCX, XLSX, TXT, CSV didukung
                        </p>
                    </div>
                ) : (
                    <div className="p-2">
                        {files.map((f) => (
                            <FileRow
                                key={f.id}
                                file={f}
                                knowledgeId={knowledgeId!}
                                onPreview={setPreviewFile}
                                onRemoved={() => {
                                    queryClient.invalidateQueries({ queryKey: ["knowledge", knowledgeId, "files"] })
                                    queryClient.invalidateQueries({ queryKey: ["knowledge"] })
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>


            {files.length > 0 && knowledgeId && <QueryPanel knowledgeId={knowledgeId} />}


            <PdfPreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />


            <div className="text-muted-foreground text-xs px-1">
                ⓘ File yang diunggah akan secara otomatis diproses dan diindeks untuk pencarian RAG.
                Gunakan '#nama-knowledge' di chat untuk menyertakan knowledge ini.
            </div>
        </div>
    )
}

export { KnowledgeDetailPage }
