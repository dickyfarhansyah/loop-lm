import { useState } from "react"
import { Plus, Settings2, Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { EditConnectionModal, AddConnectionModal } from "../components"
import {
  useConnections,
  useCreateConnection,
  useUpdateConnection,
  useDeleteConnection,
  useVerifyConnection,
} from "../hooks"
import type { Connection, ProviderType } from "../types"
import type { ConnectionFormValues } from "../schemas"

function ConnectionsSettingsPage() {
  const { t } = useTranslation()
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addModalProvider, setAddModalProvider] = useState<ProviderType>("openai")
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null)

  const { data: connections = [], isLoading } = useConnections()
  const createConnection = useCreateConnection()
  const updateConnection = useUpdateConnection()
  const deleteConnection = useDeleteConnection()
  const verifyConnection = useVerifyConnection()


  const openaiConnections = connections.filter((c) => c.providerType === "openai")
  const ollamaConnections = connections.filter((c) => c.providerType === "ollama")

  const handleAddConnection = (provider: ProviderType) => {
    setAddModalProvider(provider)
    setAddModalOpen(true)
  }

  const handleCreateConnection = (data: ConnectionFormValues & { name: string; providerType: ProviderType }) => {
    createConnection.mutate(
      {
        name: data.name,
        providerType: data.providerType,
        url: data.url,
        authType: data.authType,
        authValue: data.authValue,
        headers: data.headers ? JSON.parse(data.headers) : undefined,
        prefixId: data.prefixId,
        modelIds: data.modelIds,
        tags: data.tags,
      },
      {
        onSuccess: () => {
          toast.success(t("settingsPage.connectionAdded"))
          setAddModalOpen(false)
        },
        onError: (error) => {
          toast.error(t("settingsPage.connectionAddFailed", { error: error.message }))
        },
      }
    )
  }

  const handleEditConnection = (connection: Connection) => {
    setSelectedConnection(connection)
    setEditModalOpen(true)
  }

  const handleSaveConnection = (data: ConnectionFormValues) => {
    if (!selectedConnection) return


    let parsedHeaders: Record<string, string> | undefined
    if (data.headers && data.headers.trim()) {
      try {
        parsedHeaders = JSON.parse(data.headers)
      } catch {
        parsedHeaders = undefined
      }
    }

    updateConnection.mutate(
      {
        id: selectedConnection.id,
        request: {
          url: data.url,
          authType: data.authType,
          authValue: data.authValue,
          headers: parsedHeaders,
          prefixId: data.prefixId,
          modelIds: data.modelIds,
          tags: data.tags,
          isEnabled: data.isEnabled,
        },
      },
      {
        onSuccess: () => {
          toast.success(t("settingsPage.connectionSaved"))
          setEditModalOpen(false)
        },
        onError: (error) => {
          toast.error(t("settingsPage.connectionSaveFailed", { error: error.message }))
        },
      }
    )
  }

  const handleDeleteConnection = () => {
    if (!selectedConnection) return

    deleteConnection.mutate(selectedConnection.id, {
      onSuccess: () => {
        toast.success(t("settingsPage.connectionDeleted"))
        setEditModalOpen(false)
      },
      onError: (error) => {
        toast.error(t("settingsPage.connectionDeleteFailed", { error: error.message }))
      },
    })
  }

  const handleVerifyConnection = () => {
    if (!selectedConnection) return

    verifyConnection.mutate(selectedConnection.id, {
      onSuccess: (result) => {
        if (result.success) {
          toast.success(t("settingsPage.connectionVerified", { count: result.models?.length ?? 0 }))
        } else {
          toast.error(result.message)
        }
      },
      onError: (error) => {
        toast.error(t("settingsPage.connectionVerifyFailed", { error: error.message }))
      },
    })
  }

  const handleToggleConnection = (connection: Connection, enabled: boolean) => {
    updateConnection.mutate(
      {
        id: connection.id,
        request: { isEnabled: enabled },
      },
      {
        onSuccess: () => {
          toast.success(enabled ? t("settingsPage.connectionEnabled") : t("settingsPage.connectionDisabled"))
        },
        onError: (error) => {
          toast.error(t("settingsPage.connectionUpdateFailed", { error: error.message }))
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">{t("settingsPage.connectionsTitle")}</h1>

      <div className="space-y-8">

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">{t("settingsPage.openaiApiTitle")}</h2>
            {openaiConnections[0] && (
              <Switch
                checked={openaiConnections[0].isEnabled}
                onCheckedChange={(checked) =>
                  handleToggleConnection(openaiConnections[0], checked)
                }
              />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {t("settingsPage.openaiApiDesc")}
          </p>
          {openaiConnections.map((connection) => (
            <div key={connection.id} className="flex items-center gap-2">
              <Input
                value={connection.url}
                className="flex-1"
                readOnly
              />
              <Button variant="ghost" size="icon" onClick={() => handleAddConnection("openai")}>
                <Plus className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditConnection(connection)}
              >
                <Settings2 className="size-4" />
              </Button>
            </div>
          ))}
          {openaiConnections.length === 0 && (
            <div className="flex items-center gap-2">
              <Input
                placeholder={t("settingsPage.openaiNoConnection")}
                className="flex-1"
                readOnly
              />
              <Button variant="ghost" size="icon" onClick={() => handleAddConnection("openai")}>
                <Plus className="size-4" />
              </Button>
            </div>
          )}
        </section>


        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">{t("settingsPage.ollamaApiTitle")}</h2>
            {ollamaConnections[0] && (
              <Switch
                checked={ollamaConnections[0].isEnabled}
                onCheckedChange={(checked) =>
                  handleToggleConnection(ollamaConnections[0], checked)
                }
              />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {t("settingsPage.ollamaApiDesc")}
          </p>
          {ollamaConnections.map((connection) => (
            <div key={connection.id} className="flex items-center gap-2">
              <Input
                value={connection.url}
                className="flex-1"
                readOnly
              />
              <Button variant="ghost" size="icon" onClick={() => handleAddConnection("ollama")}>
                <Plus className="size-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Download className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditConnection(connection)}
              >
                <Settings2 className="size-4" />
              </Button>
            </div>
          ))}
          {ollamaConnections.length === 0 && (
            <div className="flex items-center gap-2">
              <Input
                placeholder={t("settingsPage.ollamaNoConnection")}
                className="flex-1"
                readOnly
              />
              <Button variant="ghost" size="icon" onClick={() => handleAddConnection("ollama")}>
                <Plus className="size-4" />
              </Button>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {t("settingsPage.ollamaHelp")}{" "}
            <a href="#" className="text-primary hover:underline">
              {t("settingsPage.ollamaHelpLink")}
            </a>
          </p>
        </section>


        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">{t("settingsPage.directConnectionsTitle")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("settingsPage.directConnectionsDesc")}
              </p>
            </div>
            <Switch />
          </div>
        </section>


        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">{t("settingsPage.cacheBaseModelTitle")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("settingsPage.cacheBaseModelDesc")}
              </p>
            </div>
            <Switch />
          </div>
        </section>
      </div>

      <EditConnectionModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        connection={selectedConnection ?? undefined}
        onSave={handleSaveConnection}
        onDelete={handleDeleteConnection}
        onVerify={handleVerifyConnection}
        isLoading={updateConnection.isPending || deleteConnection.isPending}
        isVerifying={verifyConnection.isPending}
      />

      <AddConnectionModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        providerType={addModalProvider}
        onSave={handleCreateConnection}
        isLoading={createConnection.isPending}
      />
    </div>
  )
}

export { ConnectionsSettingsPage }
