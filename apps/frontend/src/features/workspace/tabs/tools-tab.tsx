import { useState, useRef } from "react"
import { Plus, Search, X, MoreHorizontal, Copy, Trash2, Settings } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

const dummyTools = [
    {
        id: "1",
        name: "Web Search",
        description: "Mencari informasi terkini dari internet",
        category: "Pencarian",
        enabled: true,
    },
    {
        id: "2",
        name: "Kalkulator",
        description: "Melakukan perhitungan matematis kompleks",
        category: "Utilitas",
        enabled: true,
    },
    {
        id: "3",
        name: "Pengambil Gambar",
        description: "Mengambil dan menganalisis gambar dari URL",
        category: "Media",
        enabled: false,
    },
    {
        id: "4",
        name: "Eksekutor Kode",
        description: "Menjalankan kode Python secara langsung",
        category: "Pengembangan",
        enabled: true,
    },
]

function ToolsTab() {
    const [searchQuery, setSearchQuery] = useState("")
    const [tools, setTools] = useState(dummyTools)
    const importInputRef = useRef<HTMLInputElement>(null)

    const filtered = tools.filter(
        (t) =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleToggle = (id: string) => {
        setTools((prev) =>
            prev.map((t) => {
                if (t.id === id) {
                    const newState = !t.enabled
                    toast.success(newState ? "Alat diaktifkan" : "Alat dinonaktifkan")
                    return { ...t, enabled: newState }
                }
                return t
            })
        )
    }

    return (
        <div>
            <input ref={importInputRef} type="file" accept=".json" hidden onChange={() => toast.info("Fitur import tool belum tersedia")} />

            
            <div className="flex flex-col gap-1 px-0.5 mt-1.5 mb-3">
                <div className="flex justify-between items-center">
                    <div className="flex items-center text-xl font-medium gap-2 shrink-0">
                        <span>Tools</span>
                        <span className="text-lg font-medium text-muted-foreground">{filtered.length}</span>
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
                            onClick={() => toast.info("Fitur buat tool belum tersedia")}
                        >
                            <Plus className="size-3" strokeWidth={2.5} />
                            <span className="hidden md:block text-xs">New Tool</span>
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
                            placeholder="Search Tools"
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
                    <div className="my-2 gap-2 grid px-3 lg:grid-cols-2">
                        {filtered.map((tool) => (
                            <div
                                key={tool.id}
                                className={`flex space-x-4 text-left w-full px-3 py-2.5 transition rounded-2xl cursor-pointer dark:hover:bg-gray-800/50 hover:bg-gray-50 ${!tool.enabled ? "opacity-60" : ""}`}
                            >
                                <div className="flex flex-1 space-x-3.5 w-full">
                                    <div className="flex items-center text-left w-full">
                                        <div className="flex-1 self-center w-full">
                                            <div className="flex items-center gap-2">
                                                <div className="line-clamp-1 text-sm font-medium">{tool.name}</div>
                                                <div className="text-muted-foreground text-xs font-medium shrink-0">{tool.category}</div>
                                            </div>
                                            <div className="px-0.5">
                                                <div className="text-xs text-muted-foreground line-clamp-1">{tool.description}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-row gap-0.5 self-center">
                                    <button
                                        className="self-center w-fit text-sm px-2 py-2 dark:text-gray-300 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-xl"
                                        onClick={() => toast.info("Fitur valves/settings belum tersedia")}
                                        title="Settings"
                                    >
                                        <Settings className="size-4" />
                                    </button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="self-center w-fit text-sm p-1.5 dark:text-gray-300 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-xl">
                                                <MoreHorizontal className="size-5" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => toast.info("Fitur edit belum tersedia")}>
                                                Edit
                                            </DropdownMenuItem>
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

                                    <Switch
                                        checked={tool.enabled}
                                        onCheckedChange={() => handleToggle(tool.id)}
                                        className="scale-90 self-center"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col justify-center items-center my-16 mb-24">
                        <div className="max-w-md text-center">
                            <div className="text-3xl mb-3">😕</div>
                            <div className="text-lg font-medium mb-1">No tools found</div>
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

export { ToolsTab }
