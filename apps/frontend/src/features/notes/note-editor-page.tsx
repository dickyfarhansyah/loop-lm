import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { TiptapEditor } from "@/components/editor"
import { NoteEditorHeader } from "./components/note-editor-header"
import { NoteMetadata } from "./components/note-metadata"
import { useNote, useUpdateNote } from "./hooks"

function NoteEditorPage() {
  const { noteId } = useParams<{ noteId: string }>()
  const navigate = useNavigate()
  const { data: note, isLoading } = useNote(noteId || "")
  const updateNote = useUpdateNote()
  const { t, i18n } = useTranslation()

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    const timeStr = date.toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" })
    if (isToday) {
      return t("notesPage.today", { time: timeStr })
    }
    return date.toLocaleDateString(i18n.language, { day: "numeric", month: "long", year: "numeric" }) + ` ${timeStr}`
  }

  const getVisibilityLabel = (visibility: string): string => {
    switch (visibility) {
      case "public": return t("notesPage.public")
      case "shared": return t("notesPage.shared")
      default: return t("notesPage.private")
    }
  }

  const [title, setTitle] = React.useState("")
  const [wordCount, setWordCount] = React.useState(0)
  const [charCount, setCharCount] = React.useState(0)
  const [initialContent, setInitialContent] = React.useState<string | null>(null)


  React.useEffect(() => {
    if (note && initialContent === null) {
      setTitle(note.title)
      setInitialContent(note.content || "")
      setWordCount(note.wordCount)
      setCharCount(note.charCount)
    }
  }, [note, initialContent])


  const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    scheduleSave({ title: newTitle })
  }

  const handleTextChange = (html: string, words: number, chars: number) => {
    setWordCount(words)
    setCharCount(chars)
    scheduleSave({ content: html })
  }

  const scheduleSave = (updates: { title?: string; content?: string }) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      if (noteId) {
        updateNote.mutate({ id: noteId, request: updates })
      }
    }, 1000)
  }


  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!note && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{t("notesPage.noteNotFound")}</p>
        <button
          onClick={() => navigate("/notes")}
          className="text-primary underline"
        >
          {t("notesPage.backToNotes")}
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex items-center px-6 py-4">
        <NoteEditorHeader />
      </div>

      <div className="flex-1 overflow-y-auto px-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full text-2xl font-semibold bg-transparent border-0 outline-none"
            placeholder={t("notesPage.untitled")}
          />

          <NoteMetadata
            date={note ? formatDate(note.updatedAt) : ""}
            visibility={note ? getVisibilityLabel(note.visibility) : t("notesPage.private")}
            wordCount={wordCount}
            charCount={charCount}
          />

          <TiptapEditor
            placeholder={t("notesPage.startWriting")}
            initialContent={initialContent || ""}
            onTextChange={handleTextChange}
          />
        </div>
      </div>
    </div>
  )
}

export { NoteEditorPage }
