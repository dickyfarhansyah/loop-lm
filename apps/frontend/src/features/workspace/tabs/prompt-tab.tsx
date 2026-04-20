import { useState, useRef } from "react"
import { Plus, Search, X, Clipboard, Check, MoreHorizontal, Trash2, Copy } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

const dummyPrompts = [
    { id: "1", name: "Asisten Umum", command: "asisten-umum", content: "Kamu adalah asisten yang membantu.", user: "Admin", is_active: true },
    { id: "2", name: "Penulis Profesional", command: "penulis-pro", content: "Kamu adalah penulis konten profesional.", user: "Admin", is_active: true },
    { id: "3", name: "Analis Data", command: "analis-data", content: "Kamu membantu menganalisis data.", user: "Admin", is_active: false },
    { id: "4", name: "Asisten Kode", command: "kode", content: "Kamu adalah ahli pemrograman.", user: "Admin", is_active: true },
]

function PromptTab() {
    const [searchQuery, setSearchQuery] = useState("")
    const [prompts, setPrompts] = useState(dummyPrompts)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const importInputRef = useRef<HTMLInputElement>(null)

    const filtered = prompts.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.content.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleCopy = (content: string, command: string) => {
        navigator.clipboard.writeText(content)
        setCopiedId(command)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const handleToggle = (id: string) => {
        setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p)))
    }

    return (
        <div>
            <input ref={importInputRef} type="file" accept=".json" hidden onChange={() => toast.info("Fitur import prompt belum tersedia")} />

            
            <div className="flex flex-col gap-1 px-0.5 mt-1.5 mb-3">
                <div className="flex justify-between items-center">
                    <div className="flex items-center text-xl font-medium gap-2 shrink-0">
                        <span>Prompts</span>
                        <span className="text-lg font-medium text-muted-foreground">{prompts.length}</span>
                    </div>
                    <div className="flex w-full justify-end gap-1.5">
                        <button
                            className="flex text-xs items-center px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition font-medium"
                            onClick={() => importInputRef.current?.click()}
                        >
                            Import
                        </button>
                        <button
                            className="px-2 py-1.5 rounded-xl bg-black text-white dark:bg-white dark:text-black transition font-medium text-sm flex items-center gap-1"
                            onClick={() => toast.info("Fitur buat prompt belum tersedia")}
                        >
                            <Plus className="size-3" strokeWidth={2.5} />
                            <span className="hidden md:block text-xs">New Prompt</span>
                        </button>
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
                            className="w-full text-sm pr-4 py-1 rounded-r-xl outline-none bg-transparent"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search Prompts"
                        />
                        {searchQuery && (
                            <button
                                className="p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                onClick={() => setSearchQuery("")}
                            >
                                <X className="size-3" />
                            </button>
                        )}
                    </div>
                </div>

                
                {filtered.length > 0 ? (
                    <div className="gap-2 grid my-2 px-3 lg:grid-cols-2">
                        {filtered.map((prompt) => (
                            <div
                                key={prompt.id}
                                className="flex space-x-4 cursor-pointer text-left w-full px-3 py-2.5 dark:hover:bg-gray-800/50 hover:bg-gray-50 transition rounded-2xl"
                            >
                                <div className="flex flex-col flex-1 space-x-4 cursor-pointer w-full pl-1">
                                    <div className="flex items-center justify-between w-full mb-0.5">
                                        <div className="flex items-center gap-2">
                                            <div className="font-medium line-clamp-1 capitalize">{prompt.name}</div>
                                            <div className="text-xs overflow-hidden text-ellipsis line-clamp-1 text-muted-foreground">
                                                /{prompt.command}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-1 text-xs">
                                        <div className="shrink-0 text-muted-foreground">By {prompt.user}</div>
                                        <div className="text-muted-foreground">·</div>
                                        <div className="line-clamp-1 text-muted-foreground">{prompt.content}</div>
                                    </div>
                                </div>

                                <div className="flex flex-row gap-0.5 self-center">
                                    <button
                                        className="self-center w-fit text-sm p-1.5 dark:text-gray-300 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-xl"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCopy(prompt.content, prompt.command) }}
                                        title="Copy Prompt"
                                    >
                                        {copiedId === prompt.command ? <Check className="size-4" /> : <Clipboard className="size-4" />}
                                    </button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="self-center w-fit text-sm p-1.5 dark:text-gray-300 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-xl">
                                                <MoreHorizontal className="size-5" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => toast.info("Fitur share belum tersedia")}>
                                                Share
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => toast.info("Fitur clone belum tersedia")}>
                                                <Copy className="size-4 mr-2" /> Clone
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => toast.info("Fitur export belum tersedia")}>
                                                Export
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={() => toast.info("Fitur hapus belum tersedia")}
                                            >
                                                <Trash2 className="size-4 mr-2" /> Hapus
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleToggle(prompt.id) }}
                                        className="self-center"
                                    >
                                        <Switch
                                            checked={prompt.is_active}
                                            onCheckedChange={() => handleToggle(prompt.id)}
                                            className="scale-90"
                                        />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col justify-center items-center my-16 mb-24">
                        <div className="max-w-md text-center">
                            <div className="text-3xl mb-3">😕</div>
                            <div className="text-lg font-medium mb-1">No prompts found</div>
                            <div className="text-muted-foreground text-center text-xs">
                                Try adjusting your search or filter to find what you are looking for.
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    )
}

export { PromptTab }
