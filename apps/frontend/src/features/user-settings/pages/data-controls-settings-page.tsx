import * as React from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Download, Upload, Archive, Trash2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { chatApi } from "@/api"
import { useQueryClient } from "@tanstack/react-query"

function DataControlsSettingsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [isArchiveAllDialogOpen, setIsArchiveAllDialogOpen] = React.useState(false)
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)
  const [isImporting, setIsImporting] = React.useState(false)
  const [isArchivingAll, setIsArchivingAll] = React.useState(false)
  const [isDeletingAll, setIsDeletingAll] = React.useState(false)

  const handleExportChats = async () => {
    try {
      setIsExporting(true)
      
      const [activeChats, archivedChats] = await Promise.all([
        chatApi.getAll({ archived: false }).then((res) => res.data),
        chatApi.getAll({ archived: true }).then((res) => res.data),
      ])

      const allChats = [...activeChats, ...archivedChats]

      
      const dataStr = JSON.stringify(allChats, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })

      
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `chats-export-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(t("dataControls.exportSuccess"))
    } catch (error) {
      console.error("Export error:", error)
      toast.error(t("dataControls.exportFailed"))
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportChats = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsImporting(true)
      const text = await file.text()
      const chats = JSON.parse(text)

      if (!Array.isArray(chats)) {
        throw new Error("Invalid format")
      }

      
      let imported = 0
      for (const chat of chats) {
        try {
          await chatApi.create({ title: chat.title })
          imported++
        } catch (error) {
          console.error("Failed to import chat:", chat, error)
        }
      }

      queryClient.invalidateQueries({ queryKey: ["chats"] })
      toast.success(t("dataControls.importSuccess", { count: imported }))
    } catch (error) {
      console.error("Import error:", error)
      toast.error(t("dataControls.importFailed"))
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleArchiveAll = async () => {
    try {
      setIsArchivingAll(true)
      const chats = await chatApi.getAll({ archived: false }).then((res) => res.data)

      
      await Promise.all(
        chats.map((chat) => chatApi.archive(chat.id, true))
      )

      queryClient.invalidateQueries({ queryKey: ["chats"] })
      toast.success(t("dataControls.archiveAllSuccess"))
      setIsArchiveAllDialogOpen(false)
    } catch (error) {
      console.error("Archive all error:", error)
      toast.error(t("dataControls.archiveAllFailed"))
    } finally {
      setIsArchivingAll(false)
    }
  }

  const handleDeleteAll = async () => {
    try {
      setIsDeletingAll(true)
      const [activeChats, archivedChats] = await Promise.all([
        chatApi.getAll({ archived: false }).then((res) => res.data),
        chatApi.getAll({ archived: true }).then((res) => res.data),
      ])

      const allChats = [...activeChats, ...archivedChats]

      
      await Promise.all(
        allChats.map((chat) => chatApi.delete(chat.id))
      )

      queryClient.invalidateQueries({ queryKey: ["chats"] })
      toast.success(t("dataControls.deleteAllSuccess"))
      setIsDeleteAllDialogOpen(false)
    } catch (error) {
      console.error("Delete all error:", error)
      toast.error(t("dataControls.deleteAllFailed"))
    } finally {
      setIsDeletingAll(false)
    }
  }

  const handleViewArchived = () => {
    navigate("/")
    
    toast.info(t("dataControls.viewArchivedHint"))
  }

  return (
    <div className="w-full ">
      <h2 className="text-xl font-semibold mb-6">{t("dataControls.title")}</h2>

      <div className="space-y-3">
        
        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full  flex items-center justify-center">
              <Upload className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">{t("dataControls.importChats")}</h3>
              <p className="text-sm text-muted-foreground">{t("dataControls.importChatsDesc")}</p>
            </div>
          </div>
          <Button

            size="sm"
            onClick={handleImportChats}
            disabled={isImporting}
          >
            {isImporting ? t("dataControls.importing") : t("dataControls.import")}
          </Button>
        </div>

        
        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full  flex items-center justify-center">
              <Download className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">{t("dataControls.exportChats")}</h3>
              <p className="text-sm text-muted-foreground">{t("dataControls.exportChatsDesc")}</p>
            </div>
          </div>
          <Button

            size="sm"
            onClick={handleExportChats}
            disabled={isExporting}
          >
            {isExporting ? t("dataControls.exporting") : t("dataControls.export")}
          </Button>
        </div>

        
        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full  flex items-center justify-center">
              <FileText className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">{t("dataControls.archivedChats")}</h3>
              <p className="text-sm text-muted-foreground">{t("dataControls.archivedChatsDesc")}</p>
            </div>
          </div>
          <Button

            size="sm"
            onClick={handleViewArchived}
          >
            {t("dataControls.view")}
          </Button>
        </div>

        
        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full flex items-center justify-center">
              <Archive className="size-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-medium">{t("dataControls.archiveAll")}</h3>
              <p className="text-sm text-muted-foreground">{t("dataControls.archiveAllDesc")}</p>
            </div>
          </div>
          <Button

            size="sm"
            onClick={() => setIsArchiveAllDialogOpen(true)}
          >
            {t("dataControls.archive")}
          </Button>
        </div>

        
        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full  flex items-center justify-center">
              <Trash2 className="size-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-medium">{t("dataControls.deleteAll")}</h3>
              <p className="text-sm text-muted-foreground">{t("dataControls.deleteAllDesc")}</p>
            </div>
          </div>
          <Button
            
            size="sm"
            onClick={() => setIsDeleteAllDialogOpen(true)}
          >
            {t("dataControls.delete")}
          </Button>
        </div>
      </div>

      
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      
      <AlertDialog open={isArchiveAllDialogOpen} onOpenChange={setIsArchiveAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dataControls.archiveAllConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dataControls.archiveAllConfirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchivingAll}>
              {t("dataControls.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveAll}
              disabled={isArchivingAll}
            >
              {isArchivingAll ? t("dataControls.archiving") : t("dataControls.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      
      <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dataControls.deleteAllConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dataControls.deleteAllConfirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAll}>
              {t("dataControls.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={isDeletingAll}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeletingAll ? t("dataControls.deleting") : t("dataControls.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export { DataControlsSettingsPage }

