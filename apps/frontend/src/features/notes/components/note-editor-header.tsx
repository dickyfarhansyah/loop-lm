import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

function NoteEditorHeader() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(-1)}>
      <ArrowLeft className="size-4" />
      {t("notesPage.back")}
    </Button>
  )
}

export { NoteEditorHeader }
