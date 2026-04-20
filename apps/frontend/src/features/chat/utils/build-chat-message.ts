import { knowledgeApi } from "@/api/knowledge.api"
import type { RagSource } from "../types"

export interface BuildChatMessageParams {
    message: string
    documents?: { filename: string; content: string }[]
    knowledgeIds?: string[]
    knowledgeItems?: { id: string; name: string }[]
    onRagSources?: (sources: RagSource[]) => void
}

export interface BuildChatMessageResult {
    /** The content sent to the AI (includes injected document context + RAG chunks) */
    aiMessage: string
    /** The content saved as the user's chat message (includes readable attachment links) */
    displayMessage: string
}

/**
 * Builds the AI message and display message from raw user input, file attachments,
 * and optional knowledge base queries.
 */
export async function buildChatMessage({
    message,
    documents,
    knowledgeIds,
    knowledgeItems,
    onRagSources,
}: BuildChatMessageParams): Promise<BuildChatMessageResult> {
    let aiMessage = message

    // Inject document content into AI context
    if (documents && documents.length > 0) {
        const docContext = documents
            .map((doc) => `--- Dokumen: ${doc.filename} ---\n${doc.content}`)
            .join("\n\n")

        if (message) {
            aiMessage = `${docContext}\n\n--- Pertanyaan User ---\n${message}`
        } else {
            aiMessage = `${docContext}\n\nTolong analisis dokumen di atas.`
        }
    }

    // Query knowledge bases and inject RAG context
    if (knowledgeIds && knowledgeIds.length > 0 && message.trim()) {
        try {
            const allResults = await Promise.all(
                knowledgeIds.map((id) => knowledgeApi.query(id, message, 5)),
            )
            const chunks = allResults.flat().filter((r) => r.text)
            if (chunks.length > 0) {
                const ragContext = chunks
                    .map((r, i) => {
                        const filename = (r.metadata?.filename as string) || "Unknown"
                        return `[${i + 1}] [Sumber: ${filename}]\n${r.text.trim()}`
                    })
                    .join("\n\n")

                // Collect unique source filenames for document-listing questions
                const uniqueFilenames = [
                    ...new Set(
                        chunks
                            .map((r) => (r.metadata?.filename as string) || null)
                            .filter(Boolean),
                    ),
                ]
                const fileListNote =
                    uniqueFilenames.length > 0
                        ? `\nDokumen yang tersedia dalam knowledge base ini:\n${uniqueFilenames.map((f, i) => `${i + 1}. ${f}`).join("\n")}\n\nCATATAN: Penanda seperti "SK No XXXXXX" dalam teks adalah stempel/watermark internal PDF pemerintah — BUKAN nama dokumen. Gunakan nama file di atas untuk menyebut dokumen.\n`
                        : ""

                aiMessage = `--- Konteks dari Knowledge Base ---\n${fileListNote}\n${ragContext}\n\n--- Pertanyaan User ---\n${aiMessage}`
                onRagSources?.(
                    chunks.map((r) => ({
                        id: r.id,
                        filename: (r.metadata?.filename as string) || undefined,
                        text: r.text.trim().slice(0, 400),
                        distance: r.distance,
                    })),
                )
            }
        } catch {
            // Silently ignore — RAG enrichment is best-effort
        }
    }

    // Build the display message (what gets stored + shown in chat)
    let displayMessage = message
    if (documents && documents.length > 0) {
        const fileNames = documents
            .map((d) => `[${d.filename}](file-attachment:${d.filename})`)
            .join("\n\n")
        displayMessage = message ? `${fileNames}\n\n${message}` : fileNames
    }

    // Prepend knowledge badge markers (parsed + shown as visual badges in ChatMessage)
    if (knowledgeItems && knowledgeItems.length > 0) {
        const knowledgeLinks = knowledgeItems
            .map((kb) => `[${kb.name}](knowledge-attachment:${kb.id})`)
            .join("\n")
        displayMessage =
            knowledgeLinks + (displayMessage.trim() ? "\n\n" + displayMessage : "")
    }

    return { aiMessage, displayMessage }
}
