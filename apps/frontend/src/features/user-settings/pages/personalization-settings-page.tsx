import * as React from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useMe, useUpdateMe } from "@/hooks/use-auth"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import { UnderDevelopmentAlert } from "@/components/under-development-alert"

interface UserSettings {
  memory?: {
    enabled?: boolean
    items?: string[]
  }
  [key: string]: unknown
}

function PersonalizationSettingsPage() {
  const { t } = useTranslation()
  const { data: user } = useMe()
  const { mutate: updateMe } = useUpdateMe()

  const [memoryEnabled, setMemoryEnabled] = React.useState(false)
  const [memoryItems, setMemoryItems] = React.useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [newMemory, setNewMemory] = React.useState("")


  React.useEffect(() => {
    if (user && user.settings) {
      const settings = user.settings as UserSettings
      if (settings?.memory?.enabled !== undefined) {
        setMemoryEnabled(settings.memory.enabled)
      }
      if (settings?.memory?.items) {
        setMemoryItems(settings.memory.items)
      }
    }
  }, [user])

  const handleAddMemory = () => {
    if (newMemory.trim()) {
      setMemoryItems([...memoryItems, newMemory.trim()])
      setNewMemory("")
    }
  }

  const handleDeleteMemory = (index: number) => {
    setMemoryItems(memoryItems.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    const currentSettings = (user?.settings as UserSettings | null) || {}

    const newSettings: UserSettings = {
      ...currentSettings,
      memory: {
        enabled: memoryEnabled,
        items: memoryItems,
      },
    }

    updateMe(
      { settings: newSettings },
      {
        onSuccess: () => {
          toast.success(t("settings.saved"))
        },
        onError: () => {
          toast.error(t("memory.saveFailed"))
        },
      }
    )
  }

  return (
    <div className="w-full">
      <UnderDevelopmentAlert />
      <div className="flex items-start justify-between my-2">
        <div>
          <h2 className="text-xl font-semibold">
            {t("memory.title")}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({t("memory.experimental")})
            </span>
          </h2>
        </div>
        <Switch
          checked={memoryEnabled}
          onCheckedChange={setMemoryEnabled}
        />
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        {t("memory.description")}
      </p>

      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => setIsDialogOpen(true)}
          disabled={!memoryEnabled}
        >
          {t("memory.manage")}
        </Button>
      </div>


      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl p-5">
          <DialogHeader>
            <DialogTitle>{t("memory.manageTitle")}</DialogTitle>
            <DialogDescription>
              {t("memory.manageDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">

            <div className="flex gap-2">
              <Textarea
                placeholder={t("memory.addPlaceholder")}
                value={newMemory}
                onChange={(e) => setNewMemory(e.target.value)}
                className="min-h-20"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleAddMemory()
                  }
                }}
              />
              <Button
                onClick={handleAddMemory}
                disabled={!newMemory.trim()}
                size="icon"
              >
                <Plus className="size-4" />
              </Button>
            </div>


            <div className="space-y-2 max-h-96 overflow-y-auto">
              {memoryItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t("memory.noMemories")}
                </p>
              ) : (
                memoryItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-3 border rounded-lg"
                  >
                    <p className="flex-1 text-sm">{item}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      onClick={() => handleDeleteMemory(index)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>


      <div className="fixed bottom-6 right-6">
        <Button onClick={handleSave}>{t("settings.save")}</Button>
      </div>
    </div>
  )
}

export { PersonalizationSettingsPage }

