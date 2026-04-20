declare module 'word-extractor' {
    interface ExtractedContent {
        getBody(): string;
        getFootnotes(): string;
        getHeaders(): Record<string, string>;
        getFooters(): Record<string, string>;
        getAnnotations(): string;
        getTextboxes(): Record<string, string>;
    }

    class WordExtractor {
        extract(filePath: string): Promise<ExtractedContent>;
    }

    export = WordExtractor;
}
