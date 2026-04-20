import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { NotesHeader } from "./components/notes-header"
import { NotesGrid } from "./components/notes-grid"
import { useNotes, useCreateNote, useDeleteNote, useArchiveNote, usePinNote } from "./hooks"

function NotesPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filterType, setFilterType] = React.useState("all")
  const [filterCategory, setFilterCategory] = React.useState("write")
  const [viewMode, setViewMode] = React.useState("grid")

  const { data: notes = [], isLoading } = useNotes({
    archived: filterType === "archived" ? true : undefined,
    pinned: filterType === "pinned" ? true : undefined,
    search: searchQuery || undefined,
  })

  const createNote = useCreateNote()
  const deleteNote = useDeleteNote()
  const archiveNote = useArchiveNote()
  const pinNote = usePinNote()

  const handleNewNote = async () => {
    const newNote = await createNote.mutateAsync({
      title: new Date().toISOString().split("T")[0],
    })
    navigate(`/notes/${newNote.id}`)
  }

  const handleEditNote = (id: string) => {
    navigate(`/notes/${id}`)
  }

  const handleDeleteNote = (id: string) => {
    deleteNote.mutate(id)
  }

  const handleArchiveNote = (id: string) => {
    archiveNote.mutate({ id, request: { archived: true } })
  }

  const handlePinNote = (id: string) => {
    const note = notes.find((n) => n.id === id)
    if (note) {
      pinNote.mutate({ id, request: { pinned: !note.pinned } })
    }
  }

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (note.plainText || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="max-w-6xl w-full mx-auto p-6 space-y-6">
        <NotesHeader
          totalNotes={filteredNotes.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterType={filterType}
          onFilterTypeChange={setFilterType}
          filterCategory={filterCategory}
          onFilterCategoryChange={setFilterCategory}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onNewNote={handleNewNote}
        />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="w-full flex flex-col justify-center items-center my-16 mb-24">
            <div className="max-w-md text-center">
              <div className="text-3xl mb-3">😕</div>
              <div className="text-lg font-medium mb-1">
                {searchQuery ? t("notesPage.noSearchResults", { query: searchQuery }) : t("notesPage.noNotes")}
              </div>
              {!searchQuery && (
                <div className="text-muted-foreground text-center text-xs">
                  Klik "Catatan Baru" untuk membuat catatan pertama kamu.
                </div>
              )}
              {searchQuery && (
                <div className="text-muted-foreground text-center text-xs">
                  Coba ubah kata kunci pencarian.
                </div>
              )}
            </div>
          </div>
        ) : (
          <NotesGrid
            notes={filteredNotes}
            viewMode={viewMode as "grid" | "list"}
            onClickNote={handleEditNote}
            onEditNote={handleEditNote}
            onDeleteNote={handleDeleteNote}
            onArchiveNote={handleArchiveNote}
            onPinNote={handlePinNote}
          />
        )}
      </div>
    </div>
  )
}

export { NotesPage }
