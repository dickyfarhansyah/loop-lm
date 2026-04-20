import * as React from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useLocation } from "react-router-dom"
import { Sparkles } from "lucide-react"

import { ChatInput } from "./components/chat-input"
import { SuggestionCard } from "./components/suggestion-card"
import { ModelSelector } from "./components/model-selector"
import { PromptSelector } from "./components/prompt-selector"
import { useCreateChat } from "./hooks"
import { useAvailableModels } from "@/features/settings/hooks"

function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [model, setModel] = React.useState("")
  const [selectedPromptId, setSelectedPromptId] = React.useState<string | undefined>(undefined)

  const createChat = useCreateChat()
  const { data: modelsData } = useAvailableModels()
  const { t } = useTranslation()


  React.useEffect(() => {
    const enabledModels = modelsData?.data?.filter((m) => m.isEnabled !== false) ?? []
    if (!model && enabledModels.length > 0) {
      const pendingModel = (location.state as { pendingModel?: string } | null)?.pendingModel
      if (pendingModel && enabledModels.find((m) => m.id === pendingModel)) {
        setModel(pendingModel)
      } else {
        const defaultModel = enabledModels.find((m) => m.isDefault)
        setModel(defaultModel ? defaultModel.id : enabledModels[0].id)
      }
    }
  }, [model, modelsData, location.state])

  const suggestions = [
    {
      title: t("homePage.suggestion1Title"),
      description: t("homePage.suggestion1Desc"),
    },
    {
      title: t("homePage.suggestion2Title"),
      description: t("homePage.suggestion2Desc"),
    },
    {
      title: t("homePage.suggestion3Title"),
      description: t("homePage.suggestion3Desc"),
    },
  ]

  const handleSubmit = async (data: {
    message: string
    images?: File[]
    documents?: { filename: string; content: string }[]
    knowledgeIds?: string[]
    knowledgeItems?: { id: string; name: string }[]
  }) => {
    const { message, images, documents, knowledgeIds, knowledgeItems } = data


    createChat.mutate(
      { title: "New Chat" },
      {
        onSuccess: (chat) => {

          navigate(`/chat/${chat.id}`, {
            state: {
              pendingMessage: message,
              pendingImages: images,
              pendingDocuments: documents,
              pendingKnowledgeIds: knowledgeIds,
              pendingKnowledgeItems: knowledgeItems,
              pendingPromptId: selectedPromptId,
              pendingModel: model
            },
          })
        },
      }
    )
  }

  const handleSuggestionClick = (title: string, description: string) => {
    handleSubmit({ message: `${title} ${description}` })
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 py-2 flex items-center gap-2 border-b">
        <ModelSelector value={model} onChange={setModel} />
        <PromptSelector modelId={model} value={selectedPromptId} onChange={setSelectedPromptId} />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl ">

                {t("homePage.greeting")}
              </h1>
            </div>
          </div>

          <ChatInput
            onSubmit={handleSubmit}
            disabled={!model}
            placeholder={!model ? t("homePage.placeholderNoModel") : t("homePage.placeholder")}
          />

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="size-4" />
              <span>{t("homePage.suggested")}</span>
            </div>

            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <SuggestionCard
                  key={index}
                  title={suggestion.title}
                  description={suggestion.description}
                  onClick={() => handleSuggestionClick(suggestion.title, suggestion.description)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div >
  )
}

export { HomePage }
