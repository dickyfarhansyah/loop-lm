import * as React from "react"
import { Check, ChevronsUpDown, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useAvailableModels } from "@/features/settings/hooks"

interface ModelSelectorProps {
  value?: string
  onChange?: (value: string) => void
  collapsed?: boolean
}

function ModelSelector({ value, onChange, collapsed }: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const { data: modelsResponse } = useAvailableModels()

  const models = modelsResponse?.data ?? []
  const selectedModel = models.find((model) => model.id === value)

  if (collapsed) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            title={selectedModel?.id || "Pilih Model"}
          >
            <Sparkles className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start" side="right">
          <Command>
            <CommandInput placeholder="Cari model..." />
            <CommandList>
              <CommandEmpty>Model tidak ditemukan.</CommandEmpty>
              <CommandGroup>
                {models.map((model) => (
                  <CommandItem
                    key={model.id}
                    value={model.id}
                    onSelect={() => {
                      onChange?.(model.id)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value === model.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm">{model.id}</span>
                      <span className="text-xs text-muted-foreground">
                        {model.owned_by}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto py-2"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="size-4 shrink-0 text-primary" />
            <div className="flex flex-col items-start min-w-0">
              <span className="text-xs text-muted-foreground">Model</span>
              <span className="text-sm font-medium truncate">
                {selectedModel?.id || "Pilih model..."}
              </span>
            </div>
          </div>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Cari model..." />
          <CommandList>
            <CommandEmpty>Model tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {models.map((model) => (
                <CommandItem
                  key={model.id}
                  value={model.id}
                  onSelect={() => {
                    onChange?.(model.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === model.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm">{model.id}</span>
                    <span className="text-xs text-muted-foreground">
                      {model.owned_by}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { ModelSelector }
