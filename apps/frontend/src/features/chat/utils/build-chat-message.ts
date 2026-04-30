import { knowledgeApi } from "@/api/knowledge.api";
import type { RagSource } from "../types";

interface NoteInput {
  id: string;
  title: string;
  plainText?: string;
  shareId?: string | null;
}

export interface BuildChatMessageParams {
  message: string;
  documents?: { filename: string; content: string }[];
  knowledgeIds?: string[];
  knowledgeItems?: { id: string; name: string }[];
  notes?: NoteInput[];
  onRagSources?: (sources: RagSource[]) => void;
}

export interface BuildChatMessageResult {
  aiMessage: string;
  displayMessage: string;
}

export async function buildChatMessage({
  message,
  documents,
  knowledgeIds,
  knowledgeItems,
  notes,
  onRagSources,
}: BuildChatMessageParams): Promise<BuildChatMessageResult> {
  let aiMessage = message;

  const contextBlocks: string[] = [];

  if (documents && documents.length > 0) {
    const docContext = documents
      .map((doc) => `--- Dokumen: ${doc.filename} ---\n${doc.content}`)
      .join("\n\n");
    contextBlocks.push(docContext);
  }

  if (notes && notes.length > 0) {
    const noteContext = notes
      .map((note) => `--- Note: ${note.title} ---\n${note.plainText || ""}`)
      .join("\n\n");
    contextBlocks.push(noteContext);
  }

  if (contextBlocks.length > 0) {
    const combinedContext = contextBlocks.join("\n\n");
    if (message) {
      aiMessage = `${combinedContext}\n\n--- Pertanyaan User ---\n${message}`;
    } else {
      aiMessage = `${combinedContext}\n\nTolong analisis lampiran di atas.`;
    }
  }

  if (knowledgeIds && knowledgeIds.length > 0 && message.trim()) {
    try {
      const allResults = await Promise.all(
        knowledgeIds.map((id) => knowledgeApi.query(id, message, 5)),
      );

      const chunks = allResults.flat().filter((r) => r.text);

      if (chunks.length > 0) {
        const ragContext = chunks
          .map((r, i) => {
            const filename = (r.metadata?.filename as string) || "Unknown";
            return `[${i + 1}] [Sumber: ${filename}]\n${r.text.trim()}`;
          })
          .join("\n\n");

        const uniqueFilenames = [
          ...new Set(
            chunks
              .map((r) => (r.metadata?.filename as string) || null)
              .filter(Boolean),
          ),
        ];

        const fileListNote =
          uniqueFilenames.length > 0
            ? `\nDokumen yang tersedia dalam knowledge base ini:\n${uniqueFilenames
                .map((f, i) => `${i + 1}. ${f}`)
                .join(
                  "\n",
                )}\n\nCATATAN: Penanda seperti "SK No XXXXXX" dalam teks adalah stempel/watermark internal PDF pemerintah — BUKAN nama dokumen. Gunakan nama file di atas untuk menyebut dokumen.\n`
            : "";

        aiMessage = `--- Konteks dari Knowledge Base ---\n${fileListNote}\n${ragContext}\n\n--- Pertanyaan User ---\n${aiMessage}`;

        onRagSources?.(
          chunks.map((r) => ({
            id: r.id,
            filename: (r.metadata?.filename as string) || undefined,
            text: r.text.trim().slice(0, 400),
            distance: r.distance,
          })),
        );
      }
    } catch {
      // ignore
    }
  }

  const prefixLinks: string[] = [];

  if (notes && notes.length > 0) {
    prefixLinks.push(
      ...notes.map((note) => `[${note.title}](note-attachment:${note.id})`),
    );
  }

  if (documents && documents.length > 0) {
    prefixLinks.push(
      ...documents.map((d) => `[${d.filename}](file-attachment:${d.filename})`),
    );
  }

  let displayMessage =
    prefixLinks.length > 0
      ? prefixLinks.join("\n") + (message.trim() ? `\n\n${message}` : "")
      : message;

  if (knowledgeItems && knowledgeItems.length > 0) {
    const knowledgeLinks = knowledgeItems
      .map((kb) => `[${kb.name}](knowledge-attachment:${kb.id})`)
      .join("\n");

    displayMessage =
      knowledgeLinks + (displayMessage.trim() ? "\n\n" + displayMessage : "");
  }

  return { aiMessage, displayMessage };
}
