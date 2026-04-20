import type { Editor } from "@tiptap/react"
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  CheckSquare,
  Strikethrough,
  Underline,
  Undo,
  Redo,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ToolbarButtonProps {
  icon: React.ReactNode
  isActive?: boolean
  onClick?: () => void
  disabled?: boolean
}

function ToolbarButton({ icon, isActive, onClick, disabled }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("size-8", isActive && "bg-accent")}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
    </Button>
  )
}

interface TiptapToolbarProps {
  editor: Editor | null
}

function TiptapToolbar({ editor }: TiptapToolbarProps) {
  if (!editor) return null

  return (
    <div className="flex items-center gap-0.5 p-1 border-b">
      <ToolbarButton
        icon={<Undo className="size-4" />}
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      />
      <ToolbarButton
        icon={<Redo className="size-4" />}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      />
      <div className="w-px h-6 bg-border mx-1" />
      <ToolbarButton
        icon={<Heading1 className="size-4" />}
        isActive={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        icon={<Heading2 className="size-4" />}
        isActive={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        icon={<Heading3 className="size-4" />}
        isActive={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />
      <div className="w-px h-6 bg-border mx-1" />
      <ToolbarButton
        icon={<Bold className="size-4" />}
        isActive={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={<Italic className="size-4" />}
        isActive={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        icon={<Underline className="size-4" />}
        isActive={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        icon={<Strikethrough className="size-4" />}
        isActive={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <ToolbarButton
        icon={<Code className="size-4" />}
        isActive={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />
      <div className="w-px h-6 bg-border mx-1" />
      <ToolbarButton
        icon={<List className="size-4" />}
        isActive={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon={<ListOrdered className="size-4" />}
        isActive={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        icon={<CheckSquare className="size-4" />}
        isActive={editor.isActive("taskList")}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      />
    </div>
  )
}

export { TiptapToolbar }
