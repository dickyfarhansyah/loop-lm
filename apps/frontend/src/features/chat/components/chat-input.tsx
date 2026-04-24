import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Mic,
  Send,
  X,
  Paperclip,
  Camera,
  Globe,
  FileText,
  BookOpen,
  MessageSquare,
  ChevronRight,
  Loader2,
  File as FileIcon,
  Upload,
  Square,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  fileService,
  isImageFile,
  isDocumentFile,
  type ParsedDocument,
} from "../services/file-service";
import { knowledgeApi, type Knowledge } from "@/api/knowledge.api";
import { noteService } from "@/features/notes/services/note-service";
import type { Note } from "@/features/notes/types/note";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

interface DocumentAttachment {
  file: File;
  parsed?: ParsedDocument;
  isLoading: boolean;
  error?: string;
}

interface SubmitData {
  message: string;
  images?: File[];
  documents?: {
    filename: string;
    content: string;
  }[];
  knowledgeIds?: string[];
  knowledgeItems?: { id: string; name: string }[];
  notes?: SelectedNoteAttachment[];
}

interface ChatInputProps {
  onSubmit?: (data: SubmitData) => void;
  onStop?: () => void;
  onVoiceStart?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  isStreaming?: boolean;
}

export interface ChatInputRef {
  addFiles: (files: File[]) => void;
}

interface SelectedNoteAttachment {
  id: string;
  title: string;
  plainText?: string;
  shareId?: string | null;
}

const ChatInput = React.forwardRef<ChatInputRef, ChatInputProps>(
  (
    {
      onSubmit,
      onStop,
      onVoiceStart,
      placeholder = "Tanya saya apa saja...",
      className,
      disabled = false,
      isStreaming = false,
    },
    ref,
  ) => {
    const { t } = useTranslation();
    const [message, setMessage] = React.useState("");
    const [images, setImages] = React.useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = React.useState<string[]>([]);
    const [documents, setDocuments] = React.useState<DocumentAttachment[]>([]);
    const [isDragging, setIsDragging] = React.useState(false);
    const [selectedKnowledgeIds, setSelectedKnowledgeIds] = React.useState<
      string[]
    >([]);
    const [selectedNotes, setSelectedNotes] = React.useState<
      SelectedNoteAttachment[]
    >([]);
    const [hashQuery, setHashQuery] = React.useState<string | null>(null);
    const [hashPopupIndex, setHashPopupIndex] = React.useState(0);

    const { data: knowledgeList = [] } = useQuery<Knowledge[]>({
      queryKey: ["knowledge"],
      queryFn: () => knowledgeApi.list(),
    });
    const { data: notesList = [] } = useQuery<Note[]>({
      queryKey: ["notes", "attachable"],
      queryFn: () => noteService.list({ archived: false }),
    });
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const dragCounterRef = React.useRef(0);

    const filteredKnowledge = React.useMemo(() => {
      if (hashQuery === null) return [];
      const q = hashQuery.toLowerCase();
      return knowledgeList.filter(
        (k) =>
          !selectedKnowledgeIds.includes(k.id) &&
          (k.name.toLowerCase().includes(q) ||
            (k.description ?? "").toLowerCase().includes(q)),
      );
    }, [hashQuery, knowledgeList, selectedKnowledgeIds]);

    const hasText = message.trim().length > 0;
    const isDocumentLoading = documents.some((d) => d.isLoading);
    const hasContent =
      hasText ||
      images.length > 0 ||
      documents.length > 0 ||
      selectedKnowledgeIds.length > 0 ||
      selectedNotes.length > 0;

    const addFilesInternal = React.useCallback((files: File[]) => {
      for (const file of files) {
        if (isImageFile(file)) {
          setImages((prev) => [...prev, file]);
          const reader = new FileReader();
          reader.onload = (e) => {
            setImagePreviews((prev) => [...prev, e.target?.result as string]);
          };
          reader.readAsDataURL(file);
        } else if (isDocumentFile(file)) {
          const docAttachment: DocumentAttachment = {
            file,
            isLoading: true,
          };
          setDocuments((prev) => [...prev, docAttachment]);

          fileService
            .parseDocument(file)
            .then((result) => {
              setDocuments((prev) =>
                prev.map((d) =>
                  d.file === file
                    ? { ...d, isLoading: false, parsed: result.parsed }
                    : d,
                ),
              );
              toast.success(t("chatInput.fileProcessed", { name: file.name }));
            })
            .catch((error) => {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : t("chatInput.fileProcessFailedFallback");
              setDocuments((prev) =>
                prev.map((d) =>
                  d.file === file
                    ? { ...d, isLoading: false, error: errorMessage }
                    : d,
                ),
              );
              toast.error(
                t("chatInput.fileProcessFailed", { name: file.name }),
              );
            });
        } else {
          toast.error(
            t("chatInput.fileFormatUnsupported", { name: file.name }),
          );
        }
      }
    }, []);

    React.useImperativeHandle(
      ref,
      () => ({
        addFiles: addFilesInternal,
      }),
      [addFilesInternal],
    );

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (isDocumentLoading) return;

      if (
        (message.trim() ||
          images.length > 0 ||
          documents.length > 0 ||
          selectedKnowledgeIds.length > 0 ||
          selectedNotes.length > 0) &&
        onSubmit &&
        !disabled
      ) {
        const documentData = documents
          .filter((d) => d.parsed?.text)
          .map((d) => ({
            filename: d.file.name,
            content: d.parsed?.text || "",
          }));

        onSubmit({
          message,
          images: images.length > 0 ? images : undefined,
          documents: documentData.length > 0 ? documentData : undefined,
          knowledgeIds:
            selectedKnowledgeIds.length > 0 ? selectedKnowledgeIds : undefined,
          knowledgeItems:
            selectedKnowledgeIds.length > 0
              ? selectedKnowledgeIds.map((id) => {
                  const kb = knowledgeList.find((k) => k.id === id);
                  return { id, name: kb?.name ?? id };
                })
              : undefined,
          notes: selectedNotes.length > 0 ? selectedNotes : undefined,
        });
        setMessage("");
        setImages([]);
        setImagePreviews([]);
        setDocuments([]);
        setSelectedKnowledgeIds([]);
        setSelectedNotes([]);
      }
    };

    const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setMessage(val);
      const cursor = e.target.selectionStart ?? val.length;
      const textBeforeCursor = val.slice(0, cursor);
      const match = textBeforeCursor.match(/#(\S*)$/);
      if (match) {
        setHashQuery(match[1]);
        setHashPopupIndex(0);
      } else {
        setHashQuery(null);
      }
    };

    const selectKnowledgeFromHash = (kb: Knowledge) => {
      const cursor = textareaRef.current?.selectionStart ?? message.length;
      const textBeforeCursor = message.slice(0, cursor);
      const match = textBeforeCursor.match(/#(\S*)$/);
      if (match) {
        const start = cursor - match[0].length;
        setMessage(message.slice(0, start) + message.slice(cursor));
      }
      if (!selectedKnowledgeIds.includes(kb.id)) {
        setSelectedKnowledgeIds((prev) => [...prev, kb.id]);
      }
      setHashQuery(null);
      setTimeout(() => textareaRef.current?.focus(), 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (hashQuery !== null && filteredKnowledge.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHashPopupIndex((prev) => (prev + 1) % filteredKnowledge.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setHashPopupIndex(
            (prev) =>
              (prev - 1 + filteredKnowledge.length) % filteredKnowledge.length,
          );
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          const kb = filteredKnowledge[hashPopupIndex];
          if (kb) selectKnowledgeFromHash(kb);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setHashQuery(null);
          return;
        }
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        addImages(imageFiles);
      }
    };

    const addImages = (files: File[]) => {
      const newImages = [...images, ...files];
      setImages(newImages);

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews((prev) => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    };

    const addDocument = async (file: File) => {
      const docAttachment: DocumentAttachment = {
        file,
        isLoading: true,
      };
      setDocuments((prev) => [...prev, docAttachment]);

      try {
        const result = await fileService.parseDocument(file);
        setDocuments((prev) =>
          prev.map((d) =>
            d.file === file
              ? { ...d, isLoading: false, parsed: result.parsed }
              : d,
          ),
        );
        toast.success(t("chatInput.fileProcessed", { name: file.name }));
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : t("chatInput.fileProcessFailedFallback");
        setDocuments((prev) =>
          prev.map((d) =>
            d.file === file
              ? { ...d, isLoading: false, error: errorMessage }
              : d,
          ),
        );
        toast.error(t("chatInput.fileProcessFailed", { name: file.name }));
      }
    };

    const removeImage = (index: number) => {
      setImages((prev) => prev.filter((_, i) => i !== index));
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const removeDocument = (index: number) => {
      setDocuments((prev) => prev.filter((_, i) => i !== index));
    };

    const handleVoiceClick = () => {
      onVoiceStart?.();
    };

    const handleFileUpload = () => {
      fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (isImageFile(file)) {
          addImages([file]);
        } else if (isDocumentFile(file)) {
          addDocument(file);
        } else {
          toast.error(
            t("chatInput.fileFormatUnsupported", { name: file.name }),
          );
        }
      }

      e.target.value = "";
    };

    const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current++;
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDragging(false);
      }
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

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (isImageFile(file)) {
          addImages([file]);
        } else if (isDocumentFile(file)) {
          addDocument(file);
        } else {
          toast.error(
            t("chatInput.fileFormatUnsupported", { name: file.name }),
          );
        }
      }
    };

    return (
      <form
        onSubmit={handleSubmit}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn("w-full relative", className)}
      >
        {isDragging && (
          <div className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 text-primary">
              <Upload className="size-8" />
              <span className="text-sm font-medium">
                {t("chatInput.dropFile")}
              </span>
            </div>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          multiple
          className="hidden"
        />

        {selectedNotes.length > 0 && (
          <div className="flex gap-2 mb-2 px-2 flex-wrap">
            {selectedNotes.map((note) => (
              <div
                key={note.id}
                className="inline-flex items-center gap-1.5 rounded-full border bg-primary/5 px-2.5 py-1 text-xs font-medium"
              >
                <FileText className="size-3 text-primary" />
                <span className="max-w-[160px] truncate">{note.title}</span>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedNotes((prev) =>
                      prev.filter((n) => n.id !== note.id),
                    )
                  }
                  className="ml-0.5 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {selectedKnowledgeIds.length > 0 && (
          <div className="flex gap-2 mb-2 px-2 flex-wrap">
            {selectedKnowledgeIds.map((id) => {
              const kb = knowledgeList.find((k) => k.id === id);
              if (!kb) return null;
              return (
                <div
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-primary/5 px-2.5 py-1 text-xs font-medium"
                >
                  <BookOpen className="size-3 text-primary" />
                  <span className="max-w-[140px] truncate">{kb.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedKnowledgeIds((prev) =>
                        prev.filter((i) => i !== id),
                      )
                    }
                    className="ml-0.5 rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {(imagePreviews.length > 0 || documents.length > 0) && (
          <div className="flex gap-2 mb-2 px-2 flex-wrap">
            {imagePreviews.map((preview, index) => (
              <div key={`img-${index}`} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="h-20 w-20 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}

            {documents.map((doc, index) => (
              <div
                key={`doc-${index}`}
                className={cn(
                  "relative group flex items-center gap-3 h-20 px-4 rounded-xl border bg-primary/5 border-primary/20",
                  doc.error && "border-destructive bg-destructive/10",
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  {doc.isLoading ? (
                    <Loader2 className="size-5 animate-spin text-primary" />
                  ) : (
                    <FileIcon className="size-5 text-primary" />
                  )}
                </div>
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-sm font-semibold truncate text-foreground">
                    {doc.file.name}
                  </span>
                  {doc.isLoading && (
                    <span className="text-xs text-muted-foreground">
                      {t("chatPage.processing")}
                    </span>
                  )}
                  {doc.parsed && (
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(doc.file.size)}
                    </span>
                  )}
                  {doc.error && (
                    <span className="text-xs text-destructive">
                      {t("chatPage.failed")}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeDocument(index)}
                  className="ml-auto rounded-full p-1 text-muted-foreground hover:bg-background/80 hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {hashQuery !== null && (
          <div className="absolute bottom-full mb-2 left-0 right-0 z-50 rounded-xl border bg-popover shadow-lg overflow-hidden">
            <div className="px-3 py-1.5 border-b">
              <p className="text-xs text-muted-foreground">
                {t("chatInput.selectKnowledge")}{" "}
                <span className="font-medium text-foreground">
                  #{hashQuery}
                </span>
              </p>
            </div>
            {filteredKnowledge.length === 0 ? (
              <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                {knowledgeList.length === 0
                  ? t("chatInput.noKnowledge")
                  : t("chatInput.noMatch")}
              </div>
            ) : (
              <ul className="max-h-52 overflow-y-auto py-1">
                {filteredKnowledge.map((kb, i) => (
                  <li
                    key={kb.id}
                    className={cn(
                      "flex items-start gap-2.5 px-3 py-2 cursor-pointer select-none",
                      i === hashPopupIndex ? "bg-accent" : "hover:bg-accent/50",
                    )}
                    onMouseEnter={() => setHashPopupIndex(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectKnowledgeFromHash(kb);
                    }}
                  >
                    <BookOpen className="size-4 shrink-0 mt-0.5 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{kb.name}</p>
                      {kb.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {kb.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="relative flex items-center gap-2 rounded-2xl border bg-background p-2 shadow-sm">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
              >
                <Plus className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56">
              <DropdownMenuItem
                className="cursor-pointer gap-3"
                onClick={handleFileUpload}
              >
                <Paperclip className="size-4" />
                <span>{t("chatInput.uploadFile")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer gap-3">
                <Camera className="size-4" />
                <span>{t("chatInput.capture")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer gap-3">
                <Globe className="size-4" />
                <span>{t("chatInput.attachWebpage")}</span>
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer gap-3">
                  <FileText className="size-4 mr-1" />
                  <span>{t("chatInput.attachNotes")}</span>
                  {selectedNotes.length > 0 && (
                    <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {selectedNotes.length}
                    </span>
                  )}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-64 max-h-64 overflow-y-auto">
                  {notesList.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                      Tidak ada note
                    </div>
                  ) : (
                    notesList.map((note) => {
                      const selected = selectedNotes.some(
                        (n) => n.id === note.id,
                      );
                      return (
                        <DropdownMenuItem
                          key={note.id}
                          className="cursor-pointer gap-2"
                          onSelect={(e) => {
                            e.preventDefault();
                            setSelectedNotes((prev) =>
                              selected
                                ? prev.filter((n) => n.id !== note.id)
                                : [
                                    ...prev,
                                    {
                                      id: note.id,
                                      title: note.title,
                                      plainText: note.plainText,
                                      shareId: note.shareId,
                                    },
                                  ],
                            );
                          }}
                        >
                          <Check
                            className={cn(
                              "size-3.5",
                              selected ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{note.title}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {note.plainText || "Note"}
                            </p>
                          </div>
                        </DropdownMenuItem>
                      );
                    })
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer gap-3">
                  <BookOpen className="size-4 mr-1" />
                  <span>{t("chatInput.attachKnowledge")}</span>
                  {selectedKnowledgeIds.length > 0 && (
                    <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {selectedKnowledgeIds.length}
                    </span>
                  )}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-56 max-h-64 overflow-y-auto">
                  {knowledgeList.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                      {t("chatInput.noKnowledge")}
                    </div>
                  ) : (
                    knowledgeList.map((kb) => {
                      const selected = selectedKnowledgeIds.includes(kb.id);
                      return (
                        <DropdownMenuItem
                          key={kb.id}
                          className="cursor-pointer gap-2"
                          onSelect={(e) => {
                            e.preventDefault();
                            setSelectedKnowledgeIds((prev) =>
                              selected
                                ? prev.filter((id) => id !== kb.id)
                                : [...prev, kb.id],
                            );
                          }}
                        >
                          <Check
                            className={cn(
                              "size-3.5",
                              selected ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{kb.name}</p>
                            {kb.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {kb.description}
                              </p>
                            )}
                          </div>
                        </DropdownMenuItem>
                      );
                    })
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem className="cursor-pointer gap-3 justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="size-4" />
                  <span>{t("chatInput.referenceChats")}</span>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            rows={1}
            disabled={disabled || isDocumentLoading}
            className="flex-1 resize-none bg-transparent outline-none placeholder:text-muted-foreground text-sm py-2 disabled:cursor-not-allowed"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
          >
            <Mic className="size-5" />
          </Button>

          {isStreaming ? (
            <Button
              type="button"
              size="icon"
              className="shrink-0 rounded-full bg-destructive hover:bg-destructive/90"
              onClick={onStop}
            >
              <Square className="size-4 fill-current" />
            </Button>
          ) : hasContent ? (
            <Button
              type="submit"
              size="icon"
              className="shrink-0 rounded-full bg-primary"
              disabled={isDocumentLoading}
            >
              {isDocumentLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Send className="size-5" />
              )}
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              className="shrink-0 rounded-full bg-muted-foreground/80"
              onClick={handleVoiceClick}
            >
              <Mic className="size-5 text-white" />
            </Button>
          )}
        </div>
      </form>
    );
  },
);

ChatInput.displayName = "ChatInput";

export { ChatInput };
