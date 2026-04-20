import * as React from "react"
import { ChevronDown, Loader2, MessageSquare, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useQuery } from "@tanstack/react-query"
import { modelApi } from "@/api"
import { Badge } from "@/components/ui/badge"

interface PromptSelectorProps {
    modelId: string
    value?: string
    onChange: (promptId: string | undefined) => void
}

function PromptSelector({ modelId, value, onChange }: PromptSelectorProps) {
    const { data: prompts, isLoading } = useQuery({
        queryKey: ["modelPrompts", modelId],
        queryFn: async () => {
            if (!modelId) return []
            return await modelApi.getModelPrompts(modelId)
        },
        enabled: !!modelId,
    })

    
    React.useEffect(() => {
        if (prompts && prompts.length > 0 && value === undefined) {
            const defaultPrompt = prompts.find((p) => p.isDefault && p.enabled)
            if (defaultPrompt) {
                onChange(defaultPrompt.id)
            }
        }
    }, [prompts, value, onChange])

    const selectedPrompt = prompts?.find((p) => p.id === value)
    const hasPrompts = prompts && prompts.length > 0

    if (!modelId) {
        return null
    }

    return (
        <div className="flex items-center gap-1">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="gap-1 px-2 text-muted-foreground hover:text-foreground"
                        disabled={!hasPrompts && !isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <>
                                <MessageSquare className="size-4" />
                                <span className="text-sm font-normal">
                                    {selectedPrompt ? selectedPrompt.name : hasPrompts ? "Default Prompt" : "No Prompts"}
                                </span>
                                {hasPrompts && <ChevronDown className="size-4" />}
                            </>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                {hasPrompts && (
                    <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto w-64">
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                            System Prompts
                        </DropdownMenuLabel>

                        
                        <DropdownMenuItem
                            onClick={() => onChange(undefined)}
                            className="cursor-pointer"
                        >
                            <div className="flex items-center justify-between w-full">
                                <span>Default (No Custom Prompt)</span>
                                {!value && <Badge variant="secondary" className="text-xs">Active</Badge>}
                            </div>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {prompts
                            .filter((p) => p.enabled)
                            .map((prompt) => (
                                <DropdownMenuItem
                                    key={prompt.id}
                                    onClick={() => onChange(prompt.id)}
                                    className="cursor-pointer"
                                >
                                    <div className="flex flex-col gap-1 w-full">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{prompt.name}</span>
                                            <div className="flex items-center gap-1">
                                                {prompt.isDefault && (
                                                    <Star className="size-3 fill-yellow-500 text-yellow-500" />
                                                )}
                                                {value === prompt.id && (
                                                    <Badge variant="default" className="text-xs">Active</Badge>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-xs text-muted-foreground line-clamp-1">
                                            {prompt.prompt}
                                        </span>
                                    </div>
                                </DropdownMenuItem>
                            ))}

                        {prompts.filter((p) => p.enabled).length === 0 && (
                            <DropdownMenuItem disabled>
                                No enabled prompts available
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                )}
            </DropdownMenu>
        </div>
    )
}

export { PromptSelector }
