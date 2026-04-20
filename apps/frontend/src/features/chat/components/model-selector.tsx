import { ChevronDown, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAvailableModels } from "@/features/settings/hooks"

interface ModelSelectorProps {
  value: string
  onChange: (modelId: string) => void
}

function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const { data, isLoading } = useAvailableModels()
  const models = (data?.data ?? []).filter((m) => m.isEnabled !== false)

  
  const modelsByConnection = models.reduce(
    (acc, model) => {
      const connection = model.connection || model.owned_by
      if (!acc[connection]) {
        acc[connection] = []
      }
      acc[connection].push(model)
      return acc
    },
    {} as Record<string, typeof models>
  )

  const selectedModel = models.find((m) => m.id === value)

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-1 px-2 text-muted-foreground hover:text-foreground">
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <span className="text-sm font-normal">{selectedModel?.id || value || "Pilih Model"}</span>
                <ChevronDown className="size-4" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
          {Object.entries(modelsByConnection).map(([connection, connectionModels], index) => (
            <div key={connection}>
              {index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {connection}
              </DropdownMenuLabel>
              {connectionModels.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => onChange(model.id)}
                  className="cursor-pointer"
                >
                  {model.id}
                </DropdownMenuItem>
              ))}
            </div>
          ))}
          {models.length === 0 && !isLoading && (
            <DropdownMenuItem disabled>
              Tidak ada model tersedia
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export { ModelSelector }
