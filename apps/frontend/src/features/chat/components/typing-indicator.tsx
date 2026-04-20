import staticLogogram from "@/assets/images/logogram.png"
import { useAppLogo } from "@/hooks/use-app-logo"

function TypingIndicator() {
  const { logogram: uploadedLogogram } = useAppLogo()
  const logogram = uploadedLogogram || staticLogogram
  return (
    <div className="flex w-full gap-4 justify-start mb-4">

      <div className="shrink-0 size-8 rounded-full overflow-hidden bg-muted flex items-center justify-center mt-1">
        <img src={logogram} alt="AI" className="size-8 object-cover" />
      </div>


      <div className="flex items-center gap-1 pt-3">
        <span className="size-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="size-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="size-1.5 bg-muted-foreground/60 rounded-full animate-bounce" />
      </div>
    </div>
  )
}

export { TypingIndicator }
