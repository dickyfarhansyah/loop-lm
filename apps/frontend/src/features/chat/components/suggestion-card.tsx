import { cn } from "@/lib/utils"

interface SuggestionCardProps {
  title: string
  description: string
  onClick?: () => void
  className?: string
}

function SuggestionCard({
  title,
  description,
  onClick,
  className,
}: SuggestionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-xl cursor-pointer border bg-background hover:bg-accent transition-colors",
        className
      )}
    >
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </button>
  )
}

export { SuggestionCard }
