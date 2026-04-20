import { useNavigate } from "react-router-dom"
import { Lightbulb, Code, FileText } from "lucide-react"

import { cn } from "@/lib/utils"

interface QuickPrompt {
  icon: React.ElementType
  label: string
  prompt: string
  color: string
}

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    icon: Lightbulb,
    label: "Ide",
    prompt: "Bantu saya brainstorming ide untuk ",
    color: "text-amber-500 bg-amber-500/10",
  },
  {
    icon: Code,
    label: "Kode",
    prompt: "Bantu saya menulis kode untuk ",
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    icon: FileText,
    label: "Tulis",
    prompt: "Bantu saya menulis ",
    color: "text-green-500 bg-green-500/10",
  },
]

interface QuickPromptsProps {
  collapsed?: boolean
}

function QuickPrompts({ collapsed }: QuickPromptsProps) {
  const navigate = useNavigate()

  const handlePromptClick = (prompt: string) => {
    
    navigate("/", { state: { initialPrompt: prompt } })
  }

  if (collapsed) {
    return null
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {QUICK_PROMPTS.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.label}
            onClick={() => handlePromptClick(item.prompt)}
            className={cn(
              "flex flex-col items-center gap-1.5 p-3 rounded-lg",
              "border border-border/50 hover:border-border",
              "hover:bg-accent/50 transition-colors cursor-pointer"
            )}
          >
            <div className={cn("p-2 rounded-md", item.color)}>
              <Icon className="size-4" />
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export { QuickPrompts }
