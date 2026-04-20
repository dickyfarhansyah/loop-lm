import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, Search, Plus, Copy, Trash2, X, EyeOff, Eye, MoreHorizontal } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { Switch } from "@/components/ui/switch"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAvailableModels } from "@/features/settings/hooks"

import staticLogogram from "@/assets/images/logogram.png"
import { useAppLogo } from "@/hooks/use-app-logo"
import { toast } from "sonner"
import { modelApi } from "@/api/model.api"

function ModelTab() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = useState("")
    const importInputRef = useRef<HTMLInputElement>(null)
    const { logogram: uploadedLogogram } = useAppLogo()
    const logogram = uploadedLogogram || staticLogogram

    const { data, isLoading } = useAvailableModels()
    const models = data?.data ?? []

    const toggleEnabledMutation = useMutation({
        mutationFn: ({ modelId, isEnabled }: { modelId: string; isEnabled: boolean }) =>
            modelApi.toggleModelEnabled(modelId, isEnabled),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["models", "available"] })
        },
        onError: () => {
            toast.error("Gagal mengubah status model")
        },
    })

    const handleToggleModel = (modelId: string, enabled: boolean) => {
        toggleEnabledMutation.mutate(
            { modelId, isEnabled: enabled },
            {
                onSuccess: () => {
                    toast.success(enabled ? "Model diaktifkan" : "Model dinonaktifkan")
                },
            }
        )
    }

    const filteredModels = models.filter(
        (model) =>
            model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            model.owned_by.toLowerCase().includes(searchQuery.toLowerCase()) ||
            model.connection.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (isLoading) {
        return (
            <div className="w-full h-full flex justify-center items-center py-10">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div>

            <input ref={importInputRef} type="file" accept=".json" hidden onChange={() => toast.info("Fitur import model belum tersedia")} />


            <div className="flex flex-col gap-1 px-0.5 mt-1.5 mb-3">
                <div className="flex justify-between items-center">
                    <div className="flex items-center text-xl font-medium gap-2 shrink-0">
                        <span>Model</span>
                        <span className="text-lg font-medium text-muted-foreground">{models.length}</span>
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
                            onClick={() => navigate("/admin/settings/models")}
                        >
                            <Plus className="size-3" strokeWidth={2.5} />
                            <span className="hidden md:block text-xs">New Model</span>
                        </button>
                    </div>
                </div>
            </div>


            <div className="py-2 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100/30 dark:border-gray-800/30">

                <div className="px-3.5 flex flex-1 items-center w-full space-x-2 py-0.5 pb-2">
                    <div className="flex flex-1 items-center">
                        <div className="self-center ml-1 mr-3 text-muted-foreground">
                            <Search className="size-3.5" />
                        </div>
                        <input
                            className="w-full text-sm py-1 rounded-r-xl outline-none bg-transparent"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search Models"
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


                {filteredModels.length > 0 ? (
                    <div className="px-3 my-2 gap-1 lg:gap-2 grid lg:grid-cols-2">
                        {filteredModels.map((model) => {
                            const isEnabled = model.isEnabled ?? true
                            return (
                                <div
                                    key={model.id}
                                    className={`flex transition rounded-2xl w-full p-2.5 cursor-pointer dark:hover:bg-gray-800/50 hover:bg-gray-50 ${!isEnabled ? "opacity-50" : ""}`}
                                >
                                    <div className="flex gap-3.5 w-full">

                                        <div className="self-center pl-0.5">
                                            <div className="flex bg-white rounded-2xl">
                                                <img src={logogram} alt="model" className="rounded-2xl size-12 object-cover" />
                                            </div>
                                        </div>


                                        <div className="flex w-full min-w-0 flex-1 pr-1 self-center">
                                            <div className="flex h-full w-full flex-1 flex-col justify-start self-center">
                                                <div className="flex items-center justify-between w-full">
                                                    <button
                                                        className="font-medium line-clamp-1 hover:underline text-left"
                                                        onClick={() => navigate(`/admin/settings/models/${encodeURIComponent(model.id)}`)}
                                                    >
                                                        {model.id}
                                                    </button>

                                                    <div className="flex items-center gap-0.5">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button className="self-center p-1 text-sm hover:bg-black/5 dark:hover:bg-white/5 rounded-xl">
                                                                    <MoreHorizontal className="size-5" />
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => navigate(`/admin/settings/models/${encodeURIComponent(model.id)}`)}>
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => toast.info("Fitur duplikat belum tersedia")}>
                                                                    <Copy className="size-4 mr-2" /> Duplikat
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => toast.info("Fitur export belum tersedia")}>
                                                                    Export
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onClick={() => toast.info("Fitur hapus model belum tersedia")}
                                                                >
                                                                    <Trash2 className="size-4 mr-2" /> Hapus
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>

                                                        <button
                                                            onClick={() => toast.info("Toggle visibility")}
                                                            className="self-center text-sm p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl"
                                                        >
                                                            {isEnabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                                                        </button>

                                                        <Switch
                                                            checked={isEnabled}
                                                            onCheckedChange={(checked) => handleToggleModel(model.id, checked)}
                                                            className="scale-90"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex gap-1 pr-2 -mt-0.5 items-center">
                                                    <div className="shrink-0 text-muted-foreground text-xs">{model.connection}</div>
                                                    <div className="text-muted-foreground text-xs">·</div>
                                                    <div className="line-clamp-1 text-xs text-muted-foreground">{model.owned_by}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col justify-center items-center my-16 mb-24">
                        <div className="max-w-md text-center">
                            <div className="text-3xl mb-3">😕</div>
                            <div className="text-lg font-medium mb-1">No models found</div>
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

export { ModelTab }
