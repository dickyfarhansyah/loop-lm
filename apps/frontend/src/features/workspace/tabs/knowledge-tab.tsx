import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    Plus,
    Search,
    X,
    Loader2,
    MoreHorizontal,
    Trash2,
    Pencil,
} from "lucide-react"
import { toast } from "sonner"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { knowledgeApi, type Knowledge } from "@/api/knowledge.api"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface KnowledgeFormDialogProps {
    open: boolean
    onClose: () => void
    initial?: Knowledge | null
}

function KnowledgeFormDialog({ open, onClose, initial }: KnowledgeFormDialogProps) {
    const queryClient = useQueryClient()
    const [name, setName] = useState(initial?.name ?? "")
    const [description, setDescription] = useState(initial?.description ?? "")
    const [chunkingStrategy, setChunkingStrategy] = useState(initial?.chunkingStrategy ?? "default")
    const isEdit = !!initial

    const { data: strategies = [] } = useQuery({
        queryKey: ["knowledge-strategies"],
        queryFn: () => knowledgeApi.listStrategies(),
        staleTime: Infinity,
    })

    const createMutation = useMutation({
        mutationFn: (d: { name: string; description: string; chunkingStrategy: string }) => knowledgeApi.create(d),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["knowledge"] })
            toast.success("Knowledge base berhasil dibuat")
            onClose()
        },
        onError: () => toast.error("Gagal membuat knowledge base"),
    })

    const updateMutation = useMutation({
        mutationFn: (d: { name: string; description: string; chunkingStrategy: string }) =>
            knowledgeApi.update(initial!.id, d),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["knowledge"] })
            toast.success("Knowledge base diperbarui")
            onClose()
        },
        onError: () => toast.error("Gagal memperbarui knowledge base"),
    })

    const isPending = createMutation.isPending || updateMutation.isPending

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) return
        if (isEdit) {
            updateMutation.mutate({ name: name.trim(), description: description.trim(), chunkingStrategy })
        } else {
            createMutation.mutate({ name: name.trim(), description: description.trim(), chunkingStrategy })
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-md p-5">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Knowledge Base" : "Buat Knowledge Base"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="kb-name">Nama</Label>
                        <Input
                            id="kb-name"
                            placeholder="contoh: Dokumentasi Produk"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="kb-desc">
                            Deskripsi{" "}
                            <span className="text-muted-foreground text-xs">(opsional)</span>
                        </Label>
                        <Input
                            id="kb-desc"
                            placeholder="Ringkasan isi knowledge base ini…"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="kb-chunking">Strategi Chunking</Label>
                        <Select value={chunkingStrategy} onValueChange={setChunkingStrategy}>
                            <SelectTrigger id="kb-chunking" className="w-full">
                                <SelectValue placeholder="Pilih strategi…">
                                    <span className="text-sm">
                                        {strategies.find((s) => s.value === chunkingStrategy)?.label ?? "Pilih strategi…"}
                                    </span>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="w-[var(--radix-select-trigger-width)]">
                                {strategies.map((s) => (
                                    <SelectItem key={s.value} value={s.value} className="items-start py-2">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-medium text-sm">{s.label}</span>
                                            <span className="text-xs text-muted-foreground leading-snug break-words whitespace-normal">{s.description}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                                {strategies.length === 0 && (
                                    <SelectItem value="default">Default</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={onClose}
                            disabled={isPending}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            className="rounded-xl"
                            disabled={isPending || !name.trim()}
                        >
                            {isPending && <Loader2 className="size-3.5 animate-spin" />}
                            {isEdit ? "Simpan" : "Buat"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function KnowledgeTab() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = useState("")
    const [createOpen, setCreateOpen] = useState(false)
    const [editTarget, setEditTarget] = useState<Knowledge | null>(null)

    const { data = [], isLoading } = useQuery({
        queryKey: ["knowledge"],
        queryFn: () => knowledgeApi.list(),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => knowledgeApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["knowledge"] })
            toast.success("Knowledge base dihapus")
        },
        onError: () => toast.error("Gagal menghapus knowledge base"),
    })

    const filtered = data.filter(
        (k) =>
            k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            k.description.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    function formatDate(iso: string) {
        try {
            return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(iso))
        } catch {
            return iso
        }
    }

    if (isLoading) {
        return (
            <div className="w-full flex justify-center items-center py-10">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div>
            <KnowledgeFormDialog open={createOpen} onClose={() => setCreateOpen(false)} />
            {editTarget && (
                <KnowledgeFormDialog
                    key={editTarget.id}
                    open={!!editTarget}
                    onClose={() => setEditTarget(null)}
                    initial={editTarget}
                />
            )}


            <div className="flex flex-col gap-1 px-0.5 mt-1.5 mb-3">
                <div className="flex justify-between items-center">
                    <div className="flex items-center text-xl font-medium gap-2 shrink-0">
                        <span>Knowledge</span>
                        <span className="text-lg font-medium text-muted-foreground">{data.length}</span>
                    </div>
                    <div className="flex w-full justify-end gap-1.5">
                        <Button
                            size="sm"
                            className="rounded-xl"
                            onClick={() => setCreateOpen(true)}
                        >
                            <Plus className="size-3" strokeWidth={2.5} />
                            <span className="hidden md:block text-xs">New Knowledge</span>
                        </Button>
                    </div>
                </div>
            </div>


            <div className="py-2 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100/30 dark:border-gray-800/30">

                <div className="flex w-full space-x-2 py-0.5 px-3.5 pb-2">
                    <div className="flex flex-1 items-center">
                        <div className="self-center ml-1 mr-3 text-muted-foreground">
                            <Search className="size-3.5" />
                        </div>
                        <input
                            className="w-full text-sm py-1 rounded-r-xl outline-none bg-transparent"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search Knowledge"
                        />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-5 rounded-full"
                                onClick={() => setSearchQuery("")}
                            >
                                <X className="size-3" />
                            </Button>
                        )}
                    </div>
                </div>


                {filtered.length > 0 ? (
                    <div className="my-2 px-3 grid grid-cols-1 lg:grid-cols-2 gap-2">
                        {filtered.map((item) => (
                            <div
                                key={item.id}
                                className="flex space-x-4 cursor-pointer text-left w-full px-3 py-2.5 dark:hover:bg-gray-800/50 hover:bg-gray-50 transition rounded-2xl"
                                onClick={() => navigate(`/workspace/knowledge/${item.id}`)}
                            >
                                <div className="w-full">
                                    <div className="self-center flex-1">
                                        <div className="flex items-center justify-between h-8 -my-1">
                                            <div className="flex gap-2 items-center w-full">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                    {item.fileCount} file{item.fileCount !== 1 ? "s" : ""}
                                                </span>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7 rounded-xl"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MoreHorizontal className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setEditTarget(item)
                                                        }}
                                                    >
                                                        <Pencil className="size-4 mr-2" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            if (confirm(`Hapus "${item.name}"?`)) {
                                                                deleteMutation.mutate(item.id)
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="size-4 mr-2" /> Hapus
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="flex items-center gap-1 justify-between px-1.5">
                                            <div className="text-sm font-medium line-clamp-1 capitalize">
                                                {item.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                                                {formatDate(item.updatedAt)}
                                            </div>
                                        </div>
                                        {item.description && (
                                            <div className="px-1.5 text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                {item.description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col justify-center items-center my-16 mb-24">
                        <div className="max-w-md text-center">
                            <div className="text-3xl mb-3">😕</div>
                            <div className="text-lg font-medium mb-1">
                                {searchQuery ? "No knowledge found" : "Belum ada knowledge base"}
                            </div>
                            <div className="text-muted-foreground text-center text-xs">
                                {searchQuery
                                    ? "Coba ubah kata kunci pencarian."
                                    : 'Klik "New Knowledge" untuk membuat knowledge base pertama kamu.'}
                            </div>
                        </div>
                    </div>
                )}
            </div>


            <div className="text-muted-foreground text-xs m-2 mt-3">
                ⓘ Gunakan '#' di input chat untuk memuat dan menyertakan knowledge.
            </div>
        </div>
    )
}

export { KnowledgeTab }
