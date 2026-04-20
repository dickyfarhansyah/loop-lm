import * as React from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import UnderlineExtension from "@tiptap/extension-underline"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"

import { TiptapToolbar } from "./tiptap-toolbar"
import "./tiptap-editor.css"

interface TiptapEditorProps {
  content?: string
  initialContent?: string
  onChange?: (content: string) => void
  onTextChange?: (text: string, wordCount: number, charCount: number) => void
  placeholder?: string
}

function TiptapEditor({ content, initialContent, onChange, onTextChange, placeholder = "Start writing..." }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || initialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const text = editor.getText()
      const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
      const charCount = text.length

      onChange?.(html)
      onTextChange?.(text, wordCount, charCount)
    },
  })

  
  React.useEffect(() => {
    if (editor && initialContent && editor.getHTML() !== initialContent) {
      editor.commands.setContent(initialContent)
    }
  }, [editor, initialContent])

  return (
    <div className="rounded-lg border bg-background overflow-hidden">
      <TiptapToolbar editor={editor} />
      <EditorContent editor={editor} className="min-h-[300px] p-4" />
    </div>
  )
}

export { TiptapEditor }
