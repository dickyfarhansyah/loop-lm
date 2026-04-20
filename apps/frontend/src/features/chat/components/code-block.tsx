import * as React from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"

interface CodeBlockProps {
  language?: string
  children: string
}

function CodeBlock({ language, children }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className={cn(
          "absolute right-2 top-2 p-1.5 rounded-md transition-all",
          "bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground",
          "opacity-0 group-hover:opacity-100"
        )}
        title="Copy code"
      >
        {copied ? (
          <Check className="size-4 text-green-500" />
        ) : (
          <Copy className="size-4" />
        )}
      </button>
      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: "0.5rem",
          fontSize: "0.875rem",
        }}
        showLineNumbers={false}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
}

export { CodeBlock }
