"""
ChromaDB service using embedded persistent mode (no Docker required).
Falls back to HTTP client mode when CHROMA_MODE=http.
"""
from __future__ import annotations

import os
import threading
from dataclasses import dataclass
from typing import Any

import chromadb
from chromadb import EmbeddingFunction, Documents, Embeddings
from chromadb.config import Settings

from src.config.env import env

COLLECTION_NAME = "wiratek_documents"


@dataclass
class ChunkMetadata:
    userId: str
    fileId: str
    filename: str
    chunkIndex: int
    format: str


@dataclass
class ChunkQueryResult:
    id: str
    text: str
    metadata: dict
    distance: float


class LocalEmbeddingFunction(EmbeddingFunction):
    """
    Uses sentence-transformers/all-MiniLM-L6-v2 locally.
    No external API key needed — model is downloaded once on first use.
    """
    _instance = None
    _lock = threading.Lock()

    def _get_model(self):
        with self._lock:
            if self._instance is None:
                from sentence_transformers import SentenceTransformer
                self._instance = SentenceTransformer("all-MiniLM-L6-v2")
                #self._instance = SentenceTransformer("BAAI/bge-m3-small-v1.5")
        return self._instance

    def __call__(self, input: Documents) -> Embeddings:
        model = self._get_model()
        embeddings = model.encode(list(input), normalize_embeddings=True)
        return embeddings.tolist()


def _build_client() -> chromadb.ClientAPI:
    if env.CHROMA_MODE == "http":
        # Point to a running ChromaDB HTTP server
        from chromadb import HttpClient
        import urllib.parse
        parsed = urllib.parse.urlparse(env.CHROMA_URL)
        return HttpClient(host=parsed.hostname, port=parsed.port or 8000)
    else:
        # Embedded persistent mode — no Docker needed
        os.makedirs(env.CHROMA_PERSIST_DIR, exist_ok=True)
        return chromadb.PersistentClient(
            path=env.CHROMA_PERSIST_DIR,
            settings=Settings(anonymized_telemetry=False),
        )


class ChromaService:
    def __init__(self):
        self._client = _build_client()
        self._embed_fn = LocalEmbeddingFunction()
        self._collection = None

    def _get_collection(self):
        if self._collection is None:
            self._collection = self._client.get_or_create_collection(
                name=COLLECTION_NAME,
                embedding_function=self._embed_fn,
                metadata={"hnsw:space": "cosine"},
            )
        return self._collection

    def store_chunks(
        self,
        file_id: str,
        user_id: str,
        filename: str,
        fmt: str,
        chunks: list[dict],
    ) -> None:
        """Store document chunks in ChromaDB with RAG-ready embeddings."""
        if not chunks:
            return
        collection = self._get_collection()
        ids = [f"{file_id}_chunk_{c['index']}" for c in chunks]
        documents = [c["text"] for c in chunks]
        metadatas = [
            {
                "userId": user_id,
                "fileId": file_id,
                "filename": filename,
                "chunkIndex": c["index"],
                "format": fmt,
            }
            for c in chunks
        ]
        collection.upsert(ids=ids, documents=documents, metadatas=metadatas)

    def query_chunks(
        self,
        query: str,
        user_id: str,
        file_ids: list[str] | None = None,
        n_results: int = 5,
    ) -> list[ChunkQueryResult]:
        """Semantic search across user's document chunks (RAG retrieval)."""
        collection = self._get_collection()

        where: dict[str, Any] | None = None
        if file_ids and len(file_ids) == 1:
            where = {"$and": [{"userId": {"$eq": user_id}}, {"fileId": {"$eq": file_ids[0]}}]}
        elif file_ids and len(file_ids) > 1:
            where = {"$and": [{"userId": {"$eq": user_id}}, {"fileId": {"$in": file_ids}}]}
        else:
            where = {"userId": {"$eq": user_id}}

        # Guard: ChromaDB raises if n_results > number of documents in collection
        try:
            count = collection.count()
        except Exception:
            count = 0
        if count == 0:
            return []
        n_results = min(n_results, count)

        results = collection.query(
            query_texts=[query],
            n_results=n_results,
            where=where,
            include=["documents", "metadatas", "distances"],
        )

        ids = results["ids"][0] if results["ids"] else []
        documents = results["documents"][0] if results["documents"] else []
        metadatas = results["metadatas"][0] if results["metadatas"] else []
        distances = results["distances"][0] if results["distances"] else []

        return [
            ChunkQueryResult(
                id=ids[i],
                text=documents[i] if i < len(documents) else "",
                metadata=metadatas[i] if i < len(metadatas) else {},
                distance=distances[i] if i < len(distances) else 1.0,
            )
            for i in range(len(ids))
        ]

    def delete_file_chunks(self, file_id: str) -> None:
        collection = self._get_collection()
        collection.delete(where={"fileId": {"$eq": file_id}})

    def delete_user_chunks(self, user_id: str) -> None:
        collection = self._get_collection()
        collection.delete(where={"userId": {"$eq": user_id}})

    def health_check(self) -> bool:
        try:
            self._client.heartbeat()
            return True
        except Exception:
            return False

    # ------------------------------------------------------------------
    # Knowledge-scoped methods (per-knowledge ChromaDB collection)
    # ------------------------------------------------------------------

    def _get_knowledge_collection(self, knowledge_id: str):
        """Get or create a ChromaDB collection scoped to a knowledge base."""
        col_name = f"knowledge_{knowledge_id}"
        return self._client.get_or_create_collection(
            name=col_name,
            embedding_function=self._embed_fn,
            metadata={"hnsw:space": "cosine"},
        )

    def store_chunks_for_knowledge(
        self,
        knowledge_id: str,
        file_id: str,
        user_id: str,
        filename: str,
        fmt: str,
        chunks: list[dict],
    ) -> None:
        """Embed and store document chunks in a knowledge-scoped collection."""
        if not chunks:
            return
        collection = self._get_knowledge_collection(knowledge_id)
        ids = [f"{file_id}_chunk_{c['index']}" for c in chunks]
        documents = [c["text"] for c in chunks]
        metadatas = [
            {
                "userId": user_id or "",
                "fileId": file_id or "",
                "filename": filename or "",
                "chunkIndex": c["index"],
                "format": fmt or "",
            }
            for c in chunks
        ]
        collection.upsert(ids=ids, documents=documents, metadatas=metadatas)

    def query_knowledge(
        self,
        knowledge_id: str,
        query: str,
        n_results: int = 5,
        file_ids: list = None,
    ) -> list[dict]:
        """Semantic search within a knowledge-scoped collection, optionally filtered by file_ids."""
        try:
            collection = self._get_knowledge_collection(knowledge_id)
        except Exception:
            return []
        try:
            count = collection.count()
        except Exception:
            count = 0
        if count == 0:
            return []
        n_results = min(n_results, count)

        where = None
        if file_ids and len(file_ids) == 1:
            where = {"fileId": {"$eq": file_ids[0]}}
        elif file_ids and len(file_ids) > 1:
            where = {"fileId": {"$in": file_ids}}

        results = collection.query(
            query_texts=[query],
            n_results=n_results,
            where=where,
            include=["documents", "metadatas", "distances"],
        )
        ids = results["ids"][0] if results["ids"] else []
        documents = results["documents"][0] if results["documents"] else []
        metadatas = results["metadatas"][0] if results["metadatas"] else []
        distances = results["distances"][0] if results["distances"] else []
        return [
            {
                "id": ids[i],
                "text": documents[i] if i < len(documents) else "",
                "metadata": metadatas[i] if i < len(metadatas) else {},
                "distance": distances[i] if i < len(distances) else 1.0,
            }
            for i in range(len(ids))
        ]

    def delete_file_for_knowledge(self, knowledge_id: str, file_id: str) -> None:
        """Remove all chunks of a file from a knowledge-scoped collection."""
        try:
            collection = self._get_knowledge_collection(knowledge_id)
            collection.delete(where={"fileId": {"$eq": file_id}})
        except Exception:
            pass

    def delete_knowledge_collection(self, knowledge_id: str) -> None:
        """Delete the entire ChromaDB collection for a knowledge base."""
        col_name = f"knowledge_{knowledge_id}"
        try:
            self._client.delete_collection(col_name)
        except Exception:
            pass


chroma_service = ChromaService()
