import { Upload, Mic, Image } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface QuickActionsProps {
  collapsed?: boolean
  onUpload?: () => void
  onVoice?: () => void
  onImage?: () => void
}

function QuickActions({ collapsed, onUpload, onVoice, onImage }: QuickActionsProps) {
  if (collapsed) {
    return (
      <div className="flex flex-col gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" onClick={onUpload}>
              <Upload className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Upload File</TooltipContent>
        </Tooltip>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium px-1">Aksi Cepat</p>
      <div className="flex gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 h-9"
              onClick={onUpload}
            >
              <Upload className="size-3.5" />
              <span className="text-xs">Upload</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Upload file untuk dianalisis</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 h-9"
              onClick={onVoice}
            >
              <Mic className="size-3.5" />
              <span className="text-xs">Suara</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Input suara</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 h-9"
              onClick={onImage}
            >
              <Image className="size-3.5" />
              <span className="text-xs">Gambar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Buat gambar dengan AI</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

export { QuickActions }
