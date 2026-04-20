import { MessageSquare, FileText, Zap } from "lucide-react"

import { Progress } from "@/components/ui/progress"

interface UsageStatsProps {
  collapsed?: boolean
  totalChats?: number
  totalNotes?: number
  tokensUsed?: number
  tokensLimit?: number
}

function UsageStats({
  collapsed,
  totalChats = 0,
  totalNotes = 0,
  tokensUsed = 0,
  tokensLimit = 100000,
}: UsageStatsProps) {
  const usagePercentage = Math.min((tokensUsed / tokensLimit) * 100, 100)

  if (collapsed) {
    return null
  }

  return (
    <div className="p-3 rounded-lg bg-accent/50 space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium">Penggunaan Bulan Ini</span>
      </div>

      
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Zap className="size-3 text-amber-500" />
            <span>Token</span>
          </div>
          <span className="text-muted-foreground">
            {tokensUsed.toLocaleString()} / {tokensLimit.toLocaleString()}
          </span>
        </div>
        <Progress value={usagePercentage} className="h-1.5" />
      </div>

      
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 p-2 rounded-md bg-background">
          <div className="p-1.5 rounded-md bg-blue-500/10">
            <MessageSquare className="size-3.5 text-blue-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{totalChats}</span>
            <span className="text-[10px] text-muted-foreground">Obrolan</span>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-md bg-background">
          <div className="p-1.5 rounded-md bg-green-500/10">
            <FileText className="size-3.5 text-green-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{totalNotes}</span>
            <span className="text-[10px] text-muted-foreground">Catatan</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export { UsageStats }
