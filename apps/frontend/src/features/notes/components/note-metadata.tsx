import { useTranslation } from "react-i18next"

interface NoteMetadataProps {
  date: string
  visibility: string
  wordCount: number
  charCount: number
}

function NoteMetadata({ date, visibility, wordCount, charCount }: NoteMetadataProps) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <span>{date}</span>
      <span>{visibility}</span>
      <span>{wordCount} {t("notesPage.words")} {charCount} {t("notesPage.characters")}</span>
    </div>
  )
}

export { NoteMetadata }
