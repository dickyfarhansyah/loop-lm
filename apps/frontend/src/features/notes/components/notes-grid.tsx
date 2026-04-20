import { NoteCard } from "./note-card"
import { NoteListItem } from "./note-list-item"
import type { Note } from "../types/note"

interface NotesGridProps {
  notes: Note[]
  groupLabel?: string
  viewMode?: "grid" | "list"
  onClickNote?: (id: string) => void
  onEditNote?: (id: string) => void
  onDeleteNote?: (id: string) => void
  onArchiveNote?: (id: string) => void
  onPinNote?: (id: string) => void
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return "Baru saja"
  if (diffMins < 60) return `${diffMins} menit yang lalu`
  if (diffHours < 24) return `${diffHours} jam yang lalu`
  if (diffDays < 7) return `${diffDays} hari yang lalu`
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
}

function NotesGrid({ notes, groupLabel, viewMode = "grid", onClickNote, onEditNote, onDeleteNote, onArchiveNote, onPinNote }: NotesGridProps) {
  return (
    <div className="space-y-3">
      {groupLabel && (
        <p className="text-sm text-muted-foreground">{groupLabel}</p>
      )}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              title={note.title}
              content={note.plainText || note.content}
              date={formatRelativeDate(note.updatedAt)}
              pinned={note.pinned}
              visibility={note.visibility}
              onClick={() => onClickNote?.(note.id)}
              onEdit={() => onEditNote?.(note.id)}
              onDelete={() => onDeleteNote?.(note.id)}
              onArchive={() => onArchiveNote?.(note.id)}
              onPin={() => onPinNote?.(note.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notes.map((note) => (
            <NoteListItem
              key={note.id}
              title={note.title}
              content={note.plainText || note.content}
              date={formatRelativeDate(note.updatedAt)}
              pinned={note.pinned}
              visibility={note.visibility}
              onClick={() => onClickNote?.(note.id)}
              onEdit={() => onEditNote?.(note.id)}
              onDelete={() => onDeleteNote?.(note.id)}
              onArchive={() => onArchiveNote?.(note.id)}
              onPin={() => onPinNote?.(note.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export { NotesGrid }
