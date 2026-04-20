from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class ChunkingStrategy(str, Enum):
    DEFAULT = "default"
    CV = "cv"
    LEGAL = "legal"
    ARTICLE = "article"
    SPREADSHEET = "spreadsheet"
    CODE = "code"
    QA = "qa"


CHUNKING_STRATEGY_CONFIGS = {
    ChunkingStrategy.DEFAULT: {
        "label": "Default",
        "description": "General paragraph-based splitting, suitable for most documents.",
        "chunk_size": 1000,
        "chunk_overlap": 200,
        "separators": ["\n\n", "\n", ". ", "! ", "? ", " ", ""],
    },
    ChunkingStrategy.CV: {
        "label": "CV / Resume",
        "description": "Optimised for CVs and resumes. Keeps sections like Experience, Education, and Skills intact.",
        "chunk_size": 600,
        "chunk_overlap": 100,
        "separators": ["\n\n", "\n", " | ", ", ", " ", ""],
    },
    ChunkingStrategy.LEGAL: {
        "label": "Legal Document",
        "description": "Optimised for contracts, agreements, and legal documents. Larger chunks to keep clauses and articles intact.",
        "chunk_size": 1500,
        "chunk_overlap": 300,
        "separators": ["\n\n\n", "\n\n", "\nArticle ", "\nSection ", "\nChapter ", "\nClause ", "\n", ". ", " ", ""],
    },
    ChunkingStrategy.ARTICLE: {
        "label": "Article / News",
        "description": "Optimised for articles, news, and blogs. Preserves complete sentences and paragraph context.",
        "chunk_size": 800,
        "chunk_overlap": 150,
        "separators": ["\n\n", "\n", ". ", "! ", "? ", "; ", " ", ""],
    },
    ChunkingStrategy.SPREADSHEET: {
        "label": "Spreadsheet / Table",
        "description": "Optimised for tabular data from Excel or CSV. Each row is treated as an independent data unit.",
        "chunk_size": 500,
        "chunk_overlap": 50,
        "separators": ["\n", "\t", ", ", " ", ""],
    },
    ChunkingStrategy.CODE: {
        "label": "Source Code",
        "description": "Optimised for code files. Keeps functions and code blocks intact.",
        "chunk_size": 1200,
        "chunk_overlap": 200,
        "separators": ["\n\n\n", "\ndef ", "\nclass ", "\nfunction ", "\n\n", "\n", " ", ""],
    },
    ChunkingStrategy.QA: {
        "label": "Q&A / FAQ",
        "description": "Optimised for Q&A and FAQ documents. Each question-answer pair is kept together.",
        "chunk_size": 400,
        "chunk_overlap": 50,
        "separators": ["\n\n", "\nQ:", "\nA:", "\n", ". ", " ", ""],
    },
}


@dataclass
class TextChunk:
    text: str
    index: int
    start_pos: int
    end_pos: int
    metadata: Dict[str, Any] = field(default_factory=dict)


class ChunkingService:
    """
    Splits document text into overlapping chunks using configurable strategies.
    Each strategy is tuned for a specific document type.
    """

    def __init__(self) -> None:
        self._langchain_splitter_cls = None
        self._langchain_available: Optional[bool] = None

    def _get_splitter_cls(self):
        if self._langchain_available is None:
            try:
                from langchain_text_splitters import RecursiveCharacterTextSplitter
                self._langchain_splitter_cls = RecursiveCharacterTextSplitter
                self._langchain_available = True
            except ImportError:
                self._langchain_available = False
        return self._langchain_splitter_cls if self._langchain_available else None

    def split_text(
        self,
        text: str,
        strategy: ChunkingStrategy = ChunkingStrategy.DEFAULT,
        chunk_size: Optional[int] = None,
        overlap: Optional[int] = None,
    ) -> List[TextChunk]:
        # Accept raw string values from DB
        if isinstance(strategy, str):
            try:
                strategy = ChunkingStrategy(strategy)
            except ValueError:
                strategy = ChunkingStrategy.DEFAULT

        config = CHUNKING_STRATEGY_CONFIGS[strategy]
        effective_size = chunk_size if chunk_size is not None else config["chunk_size"]
        effective_overlap = overlap if overlap is not None else config["chunk_overlap"]

        # Overlap must be strictly less than chunk size
        if effective_overlap >= effective_size:
            effective_overlap = effective_size // 5

        meta_base: Dict[str, Any] = {
            "strategy": strategy.value,
            "chunk_size": effective_size,
            "chunk_overlap": effective_overlap,
        }

        splitter_cls = self._get_splitter_cls()
        if splitter_cls is not None:
            splitter = splitter_cls(
                chunk_size=effective_size,
                chunk_overlap=effective_overlap,
                separators=config["separators"],
            )
            cleaned = text.replace("\r\n", "\n").replace("\r", "\n").strip()
            if not cleaned:
                return []
            raw_chunks = splitter.split_text(cleaned)
            chunks: List[TextChunk] = []
            cursor = 0
            for i, chunk_text in enumerate(raw_chunks):
                pos = cleaned.find(chunk_text, cursor)
                start = pos if pos != -1 else cursor
                end = start + len(chunk_text)
                chunks.append(TextChunk(
                    text=chunk_text,
                    index=i,
                    start_pos=start,
                    end_pos=end,
                    metadata={**meta_base, "total": len(raw_chunks)},
                ))
                cursor = max(cursor, end - effective_overlap)
            return chunks

        return self._split_fallback(text, effective_size, effective_overlap, meta_base)

    def _split_fallback(self, text: str, chunk_size: int, overlap: int, meta_base: Dict[str, Any]) -> List[TextChunk]:
        cleaned = text.replace("\r\n", "\n").replace("\r", "\n").strip()
        if not cleaned:
            return []
        chunks: List[TextChunk] = []
        start = 0
        index = 0
        while start < len(cleaned):
            raw_end = min(start + chunk_size, len(cleaned))
            end = raw_end
            if raw_end < len(cleaned):
                end = self._find_break_point(cleaned, start, raw_end, chunk_size)
            chunk_text = cleaned[start:end].strip()
            if chunk_text:
                chunks.append(TextChunk(
                    text=chunk_text,
                    index=index,
                    start_pos=start,
                    end_pos=end,
                    metadata={**meta_base, "fallback": True},
                ))
                index += 1
            if end >= len(cleaned):
                break
            start = max(start + 1, end - overlap)
        return chunks

    def _find_break_point(self, text: str, start: int, raw_end: int, chunk_size: int) -> int:
        min_end = start + chunk_size // 2
        para = text.rfind("\n\n", start, raw_end)
        if para > min_end:
            return para + 2
        nl = text.rfind("\n", start, raw_end)
        if nl > min_end:
            return nl + 1
        for seq in [". ", "! ", "? "]:
            pos = text.rfind(seq, start, raw_end)
            if pos > min_end:
                return pos + 2
        space = text.rfind(" ", start, raw_end)
        if space > min_end:
            return space + 1
        return raw_end


chunking_service = ChunkingService()
