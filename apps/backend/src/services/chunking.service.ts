export interface TextChunk {
    text: string;
    index: number;
    startPos: number;
    endPos: number;
}

export class ChunkingService {
    

    splitText(text: string, chunkSize = 1000, overlap = 200): TextChunk[] {
        const cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
        if (!cleaned) return [];

        const chunks: TextChunk[] = [];
        let start = 0;
        let index = 0;

        while (start < cleaned.length) {
            const rawEnd = Math.min(start + chunkSize, cleaned.length);
            let end = rawEnd;

            
            if (rawEnd < cleaned.length) {
                end = this.findBreakPoint(cleaned, start, rawEnd, chunkSize);
            }

            const chunkText = cleaned.slice(start, end).trim();
            if (chunkText.length > 0) {
                chunks.push({
                    text: chunkText,
                    index: index++,
                    startPos: start,
                    endPos: end,
                });
            }

            if (end >= cleaned.length) break;

            
            start = Math.max(start + 1, end - overlap);
        }

        return chunks;
    }

    private findBreakPoint(
        text: string,
        start: number,
        rawEnd: number,
        chunkSize: number,
    ): number {
        const minEnd = start + Math.floor(chunkSize / 2);

        
        const para = text.lastIndexOf('\n\n', rawEnd);
        if (para > minEnd) return para + 2;

        
        const nl = text.lastIndexOf('\n', rawEnd);
        if (nl > minEnd) return nl + 1;

        
        const sentenceDot = text.lastIndexOf('. ', rawEnd);
        if (sentenceDot > minEnd) return sentenceDot + 2;

        const sentenceExcl = text.lastIndexOf('! ', rawEnd);
        if (sentenceExcl > minEnd) return sentenceExcl + 2;

        const sentenceQ = text.lastIndexOf('? ', rawEnd);
        if (sentenceQ > minEnd) return sentenceQ + 2;

        
        const space = text.lastIndexOf(' ', rawEnd);
        if (space > minEnd) return space + 1;

        
        return rawEnd;
    }
}

export const chunkingService = new ChunkingService();
