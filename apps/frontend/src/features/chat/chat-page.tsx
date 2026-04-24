import * as React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Loader2, Upload, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { ChatHeaderActions } from "./components/chat-header-actions";
import { ChatInput, type ChatInputRef } from "./components/chat-input";
import { ChatMessageList } from "./components/chat-message-list";
import { ChatDeleteDialog } from "./components/chat-delete-dialog";
import { ChatShareDialog } from "./components/chat-share-dialog";
import { ChatRegenDialog } from "./components/chat-regen-dialog";
import { ChatSearchBar } from "./components/chat-search-bar";
import { ModelSelector } from "./components/model-selector";
import { PromptSelector } from "./components/prompt-selector";
import { TypingIndicator } from "./components/typing-indicator";
import {
  useChat,
  useChatStream,
  useDeleteChat,
  useArchiveChat,
  usePinChat,
  useShareChat,
  useUnshareChat,
  useUpdateMessage,
  useChatScroll,
} from "./hooks";
import { buildChatMessage } from "./utils/build-chat-message";
import { useSession } from "@/hooks";
import type { ChatMessage, RagSource } from "./types";

interface LocationState {
  pendingMessage?: string;
  pendingImages?: File[];
  pendingDocuments?: { filename: string; content: string }[];
  pendingKnowledgeIds?: string[];
  pendingKnowledgeItems?: { id: string; name: string }[];
  pendingNotes?: {
    id: string;
    title: string;
    plainText?: string;
    shareId?: string | null;
  }[];
  pendingModel?: string;
  pendingPromptId?: string;
}

function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: user } = useSession();
  const { t } = useTranslation();

  // Core state
  const [model, setModel] = React.useState("");
  const [selectedPromptId, setSelectedPromptId] = React.useState<
    string | undefined
  >(undefined);
  const [isDragging, setIsDragging] = React.useState(false);
  const dragCounterRef = React.useRef(0);
  const chatInputRef = React.useRef<ChatInputRef>(null);
  const hasSentPendingMessage = React.useRef(false);

  // Dialog / UI state
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showShareDialog, setShowShareDialog] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState("");
  const [showSearch, setShowSearch] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [ragSources, setRagSources] = React.useState<RagSource[]>([]);
  const ragSourcesRef = React.useRef<RagSource[]>([]);
  const [regenModelDialog, setRegenModelDialog] = React.useState<{
    messageId: string;
  } | null>(null);
  const [regenNewModel, setRegenNewModel] = React.useState("");
  const pendingRegenRef = React.useRef<{
    content: string;
    images?: string[];
  } | null>(null);

  // Data hooks
  const state = location.state as LocationState | null;
  const { data: chat, isLoading } = useChat(chatId ?? "");
  const {
    sendMessage,
    isStreaming,
    streamingContent,
    abortStream,
    optimisticMessages,
  } = useChatStream({
    chatId: chatId ?? "",
    model,
    promptId: selectedPromptId,
    getSourcesFn: () => ragSourcesRef.current,
  });

  // Optimistic user message shown instantly on Enter (before buildChatMessage/DB save)
  const [optimisticUserMessage, setOptimisticUserMessage] =
    React.useState<ChatMessage | null>(null);

  const deleteChat = useDeleteChat();
  const archiveChat = useArchiveChat();
  const pinChat = usePinChat();
  const shareChat = useShareChat();
  const unshareChat = useUnshareChat();
  const updateMessage = useUpdateMessage();

  // Derived data
  const isShared = !!chat?.chat?.share_id;
  const existingShareUrl = isShared
    ? `${window.location.origin}/share/${chat.chat.share_id}`
    : "";

  const messages: ChatMessage[] = React.useMemo(() => {
    if (!chat?.chat?.messages) return [];
    return Object.values(chat.chat.messages).sort(
      (a, b) => a.timestamp - b.timestamp,
    );
  }, [chat]);

  // Keep ragSourcesRef current
  React.useEffect(() => {
    ragSourcesRef.current = ragSources;
  }, [ragSources]);

  // Clear optimistic user message once streaming ends — by then the real message is in DB
  React.useEffect(() => {
    if (!isStreaming && optimisticUserMessage) {
      setOptimisticUserMessage(null);
    }
  }, [isStreaming, optimisticUserMessage]);

  const displayMessages: ChatMessage[] = React.useMemo(() => {
    // Collect optimistic user messages from both page-level and hook-level state
    const allOptimistic = [
      ...(optimisticUserMessage ? [optimisticUserMessage] : []),
      ...optimisticMessages,
    ];

    // Merge optimistic messages that aren't yet in the real messages list
    // Use includes() because the saved message may have knowledge prefix prepended
    let base = messages;
    for (const opt of allOptimistic) {
      const alreadyIn = base.some(
        (m) => m.role === opt.role && m.content.includes(opt.content),
      );
      if (!alreadyIn) {
        base = [...base, opt];
      }
    }

    if (isStreaming && streamingContent) {
      const lastMessage = base[base.length - 1];
      const streamingTimestamp = lastMessage ? lastMessage.timestamp + 1 : 0;
      return [
        ...base,
        {
          id: "streaming",
          role: "assistant" as const,
          content: streamingContent,
          model,
          timestamp: streamingTimestamp,
        },
      ];
    }
    return base;
  }, [
    messages,
    isStreaming,
    streamingContent,
    model,
    optimisticUserMessage,
    optimisticMessages,
  ]);

  const filteredDisplayMessages = React.useMemo(() => {
    if (!searchQuery.trim()) return displayMessages;
    const q = searchQuery.toLowerCase();
    return displayMessages.filter((m) => m.content.toLowerCase().includes(q));
  }, [displayMessages, searchQuery]);

  // Scroll management
  const {
    scrollContainerRef,
    messagesEndRef,
    isUserScrolling,
    showScrollButton,
    scrollToBottom,
  } = useChatScroll({
    isStreaming,
    streamingContent,
    messages,
    isLoading,
    onStreamingEnd: () => {
      setRagSources([]);
      ragSourcesRef.current = [];
    },
  });

  // Effects

  // On chatId switch: clear transient streaming state
  React.useEffect(() => {
    setRagSources([]);
    ragSourcesRef.current = [];
    setOptimisticUserMessage(null);
  }, [chatId]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === "Escape" && showSearch) {
        setShowSearch(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showSearch]);

  React.useEffect(() => {
    if (pendingRegenRef.current) {
      const { content, images } = pendingRegenRef.current;
      pendingRegenRef.current = null;
      sendMessage(content, images);
    }
  }, [model]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (state?.pendingModel && !model) {
      setModel(state.pendingModel);
    } else if (messages.length > 0 && !model) {
      const firstModelMessage = messages.find((m) => m.model);
      if (firstModelMessage?.model) setModel(firstModelMessage.model);
    }
    if (state?.pendingPromptId && !selectedPromptId)
      setSelectedPromptId(state.pendingPromptId);
  }, [
    messages,
    model,
    state?.pendingModel,
    selectedPromptId,
    state?.pendingPromptId,
  ]);

  React.useEffect(() => {
    if (
      (state?.pendingMessage ||
        state?.pendingDocuments ||
        state?.pendingKnowledgeIds ||
        state?.pendingNotes) &&
      model &&
      chatId &&
      !hasSentPendingMessage.current &&
      !isStreaming &&
      !isLoading
    ) {
      hasSentPendingMessage.current = true;

      // Show optimistic message immediately while buildChatMessage/RAG runs
      if (state.pendingMessage) {
        setOptimisticUserMessage({
          id: `optimistic-${Date.now()}`,
          role: "user",
          content: state.pendingMessage,
          model,
          timestamp: Date.now(),
        });
      }

      const run = async () => {
        const images = state.pendingImages;
        let imageBase64: string[] | undefined;
        if (images && images.length > 0) {
          imageBase64 = await Promise.all(
            images.map(
              (file) =>
                new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onload = (e) => resolve(e.target?.result as string);
                  reader.readAsDataURL(file);
                }),
            ),
          );
        }

        const { aiMessage, displayMessage } = await buildChatMessage({
          message: state.pendingMessage || "",
          documents: state.pendingDocuments,
          knowledgeIds: state.pendingKnowledgeIds,
          knowledgeItems: state.pendingKnowledgeItems,
          notes: state.pendingNotes,
          onRagSources: setRagSources,
        });
        sendMessage(
          aiMessage,
          imageBase64,
          displayMessage,
          state.pendingNotes?.map(({ id, title, shareId }) => ({
            id,
            title,
            shareId,
          })),
        );
      };

      run();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [
    state,
    model,
    chatId,
    isStreaming,
    isLoading,
    sendMessage,
    navigate,
    location.pathname,
  ]);

  // Handlers
  const handleSendMessage = async (data: {
    message: string;
    images?: File[];
    documents?: { filename: string; content: string }[];
    knowledgeIds?: string[];
    knowledgeItems?: { id: string; name: string }[];
    notes?: {
      id: string;
      title: string;
      plainText?: string;
      shareId?: string | null;
    }[];
  }) => {
    if (!chatId || !model) return;

    // Show user message instantly — before image conversion and RAG query
    setOptimisticUserMessage({
      id: `optimistic-${Date.now()}`,
      role: "user",
      content: data.message,
      model,
      timestamp: Date.now(),
    });

    let imageBase64: string[] | undefined;
    if (data.images && data.images.length > 0) {
      imageBase64 = await Promise.all(
        data.images.map(
          (file) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.readAsDataURL(file);
            }),
        ),
      );
    }

    const { aiMessage, displayMessage } = await buildChatMessage({
      message: data.message,
      documents: data.documents,
      knowledgeIds: data.knowledgeIds,
      knowledgeItems: data.knowledgeItems,
      notes: data.notes,
      onRagSources: (sources) => {
        setRagSources(sources);
        ragSourcesRef.current = sources;
      },
    });

    sendMessage(
      aiMessage,
      imageBase64,
      displayMessage,
      data.notes?.map(({ id, title, shareId }) => ({ id, title, shareId })),
    );
  };

  const handleRegenerate = (assistantMessageId: string) => {
    if (!chatId || !model || isStreaming) return;
    const assistantIndex = displayMessages.findIndex(
      (m) => m.id === assistantMessageId,
    );
    if (assistantIndex === -1) return;
    for (let i = assistantIndex - 1; i >= 0; i--) {
      if (displayMessages[i].role === "user") {
        sendMessage(displayMessages[i].content, displayMessages[i].images);
        return;
      }
    }
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    if (!chatId) return;
    updateMessage.mutate(
      { chatId, messageId, request: { content: newContent } },
      {
        onSuccess: () => toast.success(t("chatPage.messageUpdated")),
        onError: () => toast.error(t("chatPage.messageUpdateFailed")),
      },
    );
  };

  const handleEditAndSend = (_messageId: string, newContent: string) => {
    if (!chatId || !model || isStreaming) return;
    sendMessage(newContent);
    toast.info(t("chatPage.sendingEdited"));
  };

  const handleExport = () => {
    const lines: string[] = [`# Chat Export\n`];
    messages
      .filter((m) => m.role !== "system")
      .forEach((m) => {
        const role = m.role === "user" ? "**User**" : "**Assistant**";
        lines.push(`${role}:\n${m.content}`, "---");
      });
    const md = lines.join("\n\n");
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${chatId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    if (!chatId) return;
    if (isShared) {
      setShareUrl(existingShareUrl);
      setShowShareDialog(true);
      return;
    }
    shareChat.mutate(chatId, {
      onSuccess: (data) => {
        setShareUrl(`${window.location.origin}/share/${data.shareId}`);
        setShowShareDialog(true);
      },
      onError: () => toast.error(t("chatPage.shareFailed")),
    });
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t("chatPage.linkCopied"));
    } catch {
      toast.error(t("chatPage.linkCopyFailed"));
    } finally {
      setShowShareDialog(false);
    }
  };

  const handleUnshare = () => {
    if (!chatId) return;
    unshareChat.mutate(chatId, {
      onSuccess: () => {
        toast.success(t("chatPage.unshared"));
        setShowShareDialog(false);
        setShareUrl("");
      },
      onError: () => toast.error(t("chatPage.unshareFailed")),
    });
  };

  const handleRegenerateWithModel = (messageId: string) => {
    setRegenNewModel(model);
    setRegenModelDialog({ messageId });
  };

  const confirmRegenerateWithModel = () => {
    if (!regenModelDialog) return;
    const { messageId } = regenModelDialog;
    setRegenModelDialog(null);

    const assistantIndex = displayMessages.findIndex((m) => m.id === messageId);
    if (assistantIndex === -1) return;

    for (let i = assistantIndex - 1; i >= 0; i--) {
      if (displayMessages[i].role === "user") {
        const userMsg = displayMessages[i];
        if (regenNewModel !== model) {
          pendingRegenRef.current = {
            content: userMsg.content,
            images: userMsg.images,
          };
          setModel(regenNewModel);
        } else {
          sendMessage(userMsg.content, userMsg.images);
        }
        return;
      }
    }
  };

  // Drag & Drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0)
      setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    chatInputRef.current?.addFiles(Array.from(files));
  };

  // Loading / not-found guards
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        {t("chatPage.notFound")}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full min-w-0 overflow-hidden relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-dashed border-primary bg-primary/10">
            <Upload className="size-12 text-primary" />
            <span className="text-lg font-medium text-primary">
              {t("chatInput.dropFile")}
            </span>
            <span className="text-sm text-muted-foreground">
              {t("chatPage.dropFileTypes")}
            </span>
          </div>
        </div>
      )}

      <div className="shrink-0 flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <ModelSelector value={model} onChange={setModel} />
          <PromptSelector
            modelId={model}
            value={selectedPromptId}
            onChange={setSelectedPromptId}
          />
        </div>
        <ChatHeaderActions
          onShare={handleShare}
          onPinChat={() => {
            if (!chatId) return;
            pinChat.mutate(
              { id: chatId, request: { pinned: true } },
              {
                onSuccess: () => toast.success(t("chatPage.pinned")),
                onError: () => toast.error(t("chatPage.pinFailed")),
              },
            );
          }}
          onArchive={() => {
            if (!chatId) return;
            archiveChat.mutate(
              { id: chatId, request: { archived: true } },
              {
                onSuccess: () => {
                  toast.success(t("chatPage.archived"));
                  navigate("/");
                },
                onError: () => toast.error(t("chatPage.archiveFailed")),
              },
            );
          }}
          onDelete={() => setShowDeleteDialog(true)}
          onExport={handleExport}
          onSearch={() => setShowSearch(true)}
        />
      </div>

      {showSearch && (
        <ChatSearchBar
          query={searchQuery}
          resultCount={
            filteredDisplayMessages.filter((m) => m.role !== "system").length
          }
          onQueryChange={setSearchQuery}
          onClose={() => setShowSearch(false)}
        />
      )}

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4"
      >
        <div className="max-w-5xl mx-auto">
          <ChatMessageList
            messages={filteredDisplayMessages}
            userName={user?.name}
            userAvatarUrl={user?.profileImageUrl}
            isStreaming={isStreaming}
            streamingSources={ragSources.length > 0 ? ragSources : undefined}
            onRegenerate={handleRegenerate}
            onEditMessage={handleEditMessage}
            onEditAndSend={handleEditAndSend}
            onDeleteMessage={() =>
              toast.info(t("chatPage.deleteMessagePending"))
            }
            onSuggestionClick={(suggestion) => sendMessage(suggestion)}
            onRegenerateWithModel={handleRegenerateWithModel}
          />
          {isStreaming && !streamingContent && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {showScrollButton && (
        <button
          type="button"
          onClick={() => {
            isUserScrolling.current = false;
            scrollToBottom(true);
          }}
          className="absolute bottom-24 right-6 z-10 flex items-center justify-center size-8 rounded-full bg-background border shadow-md hover:bg-accent transition-colors"
          title="Scroll to bottom"
        >
          <ChevronDown className="size-4" />
        </button>
      )}

      <div className="shrink-0 p-4">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            ref={chatInputRef}
            onSubmit={handleSendMessage}
            onStop={abortStream}
            disabled={!model && !isStreaming}
            isStreaming={isStreaming}
            placeholder={
              !model
                ? t("homePage.placeholderNoModel")
                : t("homePage.placeholder")
            }
          />
        </div>
      </div>

      <ChatDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={() => {
          if (!chatId) return;
          deleteChat.mutate(chatId, {
            onSuccess: () => {
              toast.success(t("chatPage.deleted"));
              navigate("/");
            },
            onError: () => toast.error(t("chatPage.deleteFailed")),
          });
          setShowDeleteDialog(false);
        }}
      />

      <ChatShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        shareUrl={shareUrl}
        onCopyLink={handleCopyShareLink}
        onUnshare={handleUnshare}
        isUnsharePending={unshareChat.isPending}
      />

      <ChatRegenDialog
        open={!!regenModelDialog}
        onOpenChange={(open) => {
          if (!open) setRegenModelDialog(null);
        }}
        selectedModel={regenNewModel}
        onModelChange={setRegenNewModel}
        onConfirm={confirmRegenerateWithModel}
      />
    </div>
  );
}

export { ChatPage };
