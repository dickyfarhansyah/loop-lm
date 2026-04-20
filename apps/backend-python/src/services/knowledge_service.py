"""
Knowledge (RAG Collection) service.

A Knowledge is a named collection of documents.
Each knowledge collection gets its own dedicated ChromaDB collection
(`knowledge_{id}`) so queries are scoped to that knowledge base only.
"""
from __future__ import annotations

import json
import logging
import os
import io
import threading
from datetime import datetime
from typing import List, Optional

from nanoid import generate
from sqlalchemy.orm import Session

from src.config.env import env
from src.db.models import Knowledge, KnowledgeFile, File
from src.utils.errors import NotFoundError, BadRequestError
from src.services.chunking_service import ChunkingStrategy, CHUNKING_STRATEGY_CONFIGS

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Serialisers
# ---------------------------------------------------------------------------

def _serialize_knowledge(k: Knowledge, file_count: int = 0) -> dict:
    return {
        "id": k.id,
        "userId": k.user_id,
        "name": k.name,
        "description": k.description or "",
        "chunkingStrategy": k.chunking_strategy or "default",
        "data": json.loads(k.data) if k.data else {},
        "fileCount": file_count,
        "createdAt": k.created_at.isoformat() if k.created_at else None,
        "updatedAt": k.updated_at.isoformat() if k.updated_at else None,
    }


def _serialize_file(f: File, kf: Optional[KnowledgeFile] = None) -> dict:
    result = {
        "id": f.id,
        "filename": f.filename,
        "meta": json.loads(f.meta) if isinstance(f.meta, str) and f.meta else (f.meta or {}),
        "createdAt": f.created_at.isoformat() if f.created_at else None,
        "updatedAt": f.updated_at.isoformat() if f.updated_at else None,
    }
    if kf is not None:
        result["embedStatus"] = kf.embed_status or "pending"
        result["embedError"] = kf.embed_error
        result["chunkCount"] = kf.chunk_count or 0
    return result


# ---------------------------------------------------------------------------
# Background embedding helper
# ---------------------------------------------------------------------------

SUPPORTED_MIMETYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "text/plain": "txt",
    "text/csv": "csv",
}


def _extract_text(data: bytes, mimetype: str) -> str:
    fmt = SUPPORTED_MIMETYPES.get(mimetype, "")
    if fmt == "pdf":
        import fitz
        doc = fitz.open(stream=data, filetype="pdf")
        pages = [page.get_text("text") for page in doc]
        doc.close()
        return "\n".join(pages)
    elif fmt == "docx":
        from docx import Document
        doc = Document(io.BytesIO(data))
        return "\n".join(p.text for p in doc.paragraphs)
    elif fmt == "xlsx":
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(data), data_only=True, read_only=True)
        lines = []
        for ws in wb.worksheets:
            for row in ws.iter_rows(values_only=True):
                lines.append("\t".join(str(c) if c is not None else "" for c in row))
        wb.close()
        return "\n".join(lines)
    elif fmt in ("txt", "csv"):
        return data.decode("utf-8", errors="replace")
    return ""


def _embed_file_in_chroma(
    knowledge_id: str,
    file_id: str,
    user_id: str,
    filename: str,
    file_path: str,
    mimetype: str,
    chunking_strategy: str = "default",
    kf_id: Optional[str] = None,
) -> None:
    """
    Background: read file from disk, extract text, split with the
    knowledge-base chunking strategy, then embed into ChromaDB.
    Updates KnowledgeFile.embed_status / chunk_count on success/failure.
    """
    from src.config.database import SessionLocal

    def _update_status(status: str, error: Optional[str] = None, chunk_count: int = 0) -> None:
        if not kf_id:
            return
        try:
            with SessionLocal() as _db:
                kf = _db.query(KnowledgeFile).filter(KnowledgeFile.id == kf_id).first()
                if kf:
                    kf.embed_status = status
                    kf.embed_error = error
                    kf.chunk_count = chunk_count
                    _db.commit()
        except Exception as upd_err:
            log.warning("[knowledge] Could not update embed_status for kf %s: %s", kf_id, upd_err)

    _update_status("indexing")
    try:
        with open(file_path, "rb") as fh:
            data = fh.read()
        text = _extract_text(data, mimetype)
        if not text.strip():
            log.warning("[knowledge] File %s produced empty text", file_id)
            _update_status("failed", error="File produced no extractable text")
            return

        try:
            strategy = ChunkingStrategy(chunking_strategy)
        except ValueError:
            strategy = ChunkingStrategy.DEFAULT

        from src.services.chunking_service import chunking_service
        text_chunks = chunking_service.split_text(text, strategy=strategy)
        chunks = [{"text": c.text, "index": c.index} for c in text_chunks]

        from src.services.chroma_service import chroma_service
        chroma_service.store_chunks_for_knowledge(
            knowledge_id=knowledge_id,
            file_id=file_id,
            user_id=user_id,
            filename=filename,
            fmt=SUPPORTED_MIMETYPES.get(mimetype, "unknown"),
            chunks=chunks,
        )
        log.info("[knowledge] Embedded %d chunks from %s into kb %s (strategy=%s)", len(chunks), file_id, knowledge_id, chunking_strategy)
        _update_status("indexed", chunk_count=len(chunks))
    except Exception as e:
        log.exception("[knowledge] Failed to embed file %s: %s", file_id, e)
        _update_status("failed", error=str(e))


# ---------------------------------------------------------------------------
# Service class
# ---------------------------------------------------------------------------

class KnowledgeService:

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    def create(self, db: Session, user_id: str, name: str, description: str = "", chunking_strategy: str = "default") -> dict:
        if not name.strip():
            raise BadRequestError("Name is required")
        try:
            ChunkingStrategy(chunking_strategy)
        except ValueError:
            chunking_strategy = "default"
        kid = generate()
        now = datetime.utcnow()
        kb = Knowledge(
            id=kid,
            user_id=user_id,
            name=name.strip(),
            description=description.strip(),
            chunking_strategy=chunking_strategy,
            created_at=now,
            updated_at=now,
        )
        db.add(kb)
        db.commit()
        db.refresh(kb)
        return _serialize_knowledge(kb)

    def list(self, db: Session, user_id: str) -> list[dict]:
        rows = db.query(Knowledge).filter(Knowledge.user_id == user_id).order_by(Knowledge.updated_at.desc()).all()
        result = []
        for kb in rows:
            count = db.query(KnowledgeFile).filter(KnowledgeFile.knowledge_id == kb.id).count()
            result.append(_serialize_knowledge(kb, count))
        return result

    def get(self, db: Session, user_id: str, knowledge_id: str) -> dict:
        kb = self._get_or_404(db, user_id, knowledge_id)
        count = db.query(KnowledgeFile).filter(KnowledgeFile.knowledge_id == kb.id).count()
        return _serialize_knowledge(kb, count)

    def update(self, db: Session, user_id: str, knowledge_id: str, name: Optional[str] = None, description: Optional[str] = None, chunking_strategy: Optional[str] = None) -> dict:
        kb = self._get_or_404(db, user_id, knowledge_id)
        if name is not None:
            kb.name = name.strip()
        if description is not None:
            kb.description = description.strip()
        if chunking_strategy is not None:
            try:
                ChunkingStrategy(chunking_strategy)
                kb.chunking_strategy = chunking_strategy
            except ValueError:
                pass
        kb.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(kb)
        count = db.query(KnowledgeFile).filter(KnowledgeFile.knowledge_id == kb.id).count()
        return _serialize_knowledge(kb, count)

    def delete(self, db: Session, user_id: str, knowledge_id: str) -> None:
        kb = self._get_or_404(db, user_id, knowledge_id)
        # Delete knowledge-scoped ChromaDB collection
        try:
            from src.services.chroma_service import chroma_service
            chroma_service.delete_knowledge_collection(knowledge_id)
        except Exception as e:
            log.warning("[knowledge] Could not delete chroma collection for %s: %s", knowledge_id, e)
        db.delete(kb)
        db.commit()

    # ------------------------------------------------------------------
    # Files
    # ------------------------------------------------------------------

    def list_files(self, db: Session, user_id: str, knowledge_id: str) -> List[dict]:
        self._get_or_404(db, user_id, knowledge_id)
        rows = (
            db.query(File, KnowledgeFile)
            .join(KnowledgeFile, KnowledgeFile.file_id == File.id)
            .filter(KnowledgeFile.knowledge_id == knowledge_id)
            .order_by(KnowledgeFile.created_at.desc())
            .all()
        )
        return [_serialize_file(f, kf) for f, kf in rows]

    def add_file(self, db: Session, user_id: str, knowledge_id: str, file_id: str) -> dict:
        """
        Attach an already-uploaded file to a knowledge base.
        Triggers background embedding into the knowledge-scoped ChromaDB collection.
        Returns 409-style error if the file is already linked (no duplicate indexing).
        """
        kb = self._get_or_404(db, user_id, knowledge_id)

        file = db.query(File).filter(File.id == file_id, File.user_id == user_id).first()
        if not file:
            raise NotFoundError("File not found")

        existing = db.query(KnowledgeFile).filter(
            KnowledgeFile.knowledge_id == knowledge_id,
            KnowledgeFile.file_id == file_id,
        ).first()
        if existing:
            return _serialize_file(file, existing)

        kf = KnowledgeFile(
            id=generate(),
            knowledge_id=knowledge_id,
            file_id=file_id,
            embed_status="pending",
            chunk_count=0,
            created_at=datetime.utcnow(),
        )
        db.add(kf)
        kb.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(kf)

        meta = json.loads(file.meta) if isinstance(file.meta, str) and file.meta else (file.meta or {})
        mimetype = meta.get("mimetype", "")
        threading.Thread(
            target=_embed_file_in_chroma,
            args=(knowledge_id, file.id, user_id, file.filename, file.path, mimetype, kb.chunking_strategy or "default", kf.id),
            daemon=True,
        ).start()

        return _serialize_file(file, kf)

    def remove_file(self, db: Session, user_id: str, knowledge_id: str, file_id: str) -> None:
        kb = self._get_or_404(db, user_id, knowledge_id)
        kf = db.query(KnowledgeFile).filter(
            KnowledgeFile.knowledge_id == knowledge_id,
            KnowledgeFile.file_id == file_id,
        ).first()
        if not kf:
            raise NotFoundError("File is not part of this knowledge base")
        db.delete(kf)
        kb.updated_at = datetime.utcnow()
        db.commit()
        # Remove file's chunks from knowledge ChromaDB collection
        try:
            from src.services.chroma_service import chroma_service
            chroma_service.delete_file_for_knowledge(knowledge_id, file_id)
        except Exception as e:
            log.warning("[knowledge] Could not remove chroma chunks for file %s: %s", file_id, e)

    def reindex_file(self, db: Session, user_id: str, knowledge_id: str, file_id: str) -> dict:
        """
        Re-trigger background embedding for a file already in the knowledge base.
        Deletes existing chunks first, then re-embeds from disk.
        """
        kb = self._get_or_404(db, user_id, knowledge_id)
        kf = db.query(KnowledgeFile).filter(
            KnowledgeFile.knowledge_id == knowledge_id,
            KnowledgeFile.file_id == file_id,
        ).first()
        if not kf:
            raise NotFoundError("File is not part of this knowledge base")
        file = db.query(File).filter(File.id == file_id, File.user_id == user_id).first()
        if not file:
            raise NotFoundError("File not found")
        meta = json.loads(file.meta) if isinstance(file.meta, str) and file.meta else (file.meta or {})
        mimetype = meta.get("mimetype", "")
        # Reset status before re-indexing
        kf.embed_status = "pending"
        kf.embed_error = None
        kf.chunk_count = 0
        db.commit()
        # Delete stale chunks
        try:
            from src.services.chroma_service import chroma_service
            chroma_service.delete_file_for_knowledge(knowledge_id, file_id)
        except Exception as e:
            log.warning("[knowledge] Could not clear stale chunks for file %s: %s", file_id, e)
        threading.Thread(
            target=_embed_file_in_chroma,
            args=(knowledge_id, file.id, user_id, file.filename, file.path, mimetype, kb.chunking_strategy or "default", kf.id),
            daemon=True,
        ).start()
        return {"message": "Re-indexing started"}

    def upload_and_add_file(self, db: Session, user_id: str, knowledge_id: str, file_data: dict) -> dict:
        """
        Upload a new file AND add it to the knowledge base in one step.
        """
        self._get_or_404(db, user_id, knowledge_id)
        from src.services.file_service import file_service
        uploaded = file_service.upload_file(db, file_data, user_id)
        file_id = uploaded["id"]
        return self.add_file(db, user_id, knowledge_id, file_id)

    def batch_add_files(self, db: Session, user_id: str, knowledge_id: str, file_ids: List[str]) -> List[dict]:
        """Attach multiple already-uploaded files to a knowledge base at once."""
        return [self.add_file(db, user_id, knowledge_id, fid) for fid in file_ids]

    def batch_upload_files(self, db: Session, user_id: str, knowledge_id: str, files_data: List[dict]) -> List[dict]:
        """Upload multiple files and add them all to the knowledge base."""
        self._get_or_404(db, user_id, knowledge_id)
        from src.services.file_service import file_service
        results = []
        for file_data in files_data:
            uploaded = file_service.upload_file(db, file_data, user_id)
            results.append(self.add_file(db, user_id, knowledge_id, uploaded["id"]))
        return results

    def stats(self, db: Session, user_id: str, knowledge_id: str) -> dict:
        """Return summary stats for a knowledge base."""
        self._get_or_404(db, user_id, knowledge_id)
        kfs = db.query(KnowledgeFile).filter(KnowledgeFile.knowledge_id == knowledge_id).all()
        total = len(kfs)
        by_status: dict = {"pending": 0, "indexing": 0, "indexed": 0, "failed": 0}
        total_chunks = 0
        for kf in kfs:
            s = kf.embed_status or "pending"
            by_status[s] = by_status.get(s, 0) + 1
            total_chunks += kf.chunk_count or 0
        return {
            "totalFiles": total,
            "totalChunks": total_chunks,
            "byStatus": by_status,
        }

    def preview_chunks(self, db: Session, user_id: str, knowledge_id: str, file_id: str, max_chunks: int = 5) -> dict:
        """Preview how a file would be chunked without re-embedding."""
        kb = self._get_or_404(db, user_id, knowledge_id)
        file = db.query(File).filter(File.id == file_id, File.user_id == user_id).first()
        if not file:
            raise NotFoundError("File not found")
        meta = json.loads(file.meta) if isinstance(file.meta, str) and file.meta else (file.meta or {})
        mimetype = meta.get("mimetype", "")
        try:
            with open(file.path, "rb") as fh:
                data = fh.read()
        except OSError as exc:
            raise BadRequestError(f"Could not read file: {exc}") from exc
        text = _extract_text(data, mimetype)
        if not text.strip():
            return {"totalChunks": 0, "preview": [], "strategy": kb.chunking_strategy}
        from src.services.chunking_service import chunking_service
        strategy = ChunkingStrategy(kb.chunking_strategy or "default")
        all_chunks = chunking_service.split_text(text, strategy=strategy)
        preview = [
            {"index": c.index, "text": c.text[:300], "length": len(c.text)}
            for c in all_chunks[:max_chunks]
        ]
        return {
            "totalChunks": len(all_chunks),
            "preview": preview,
            "strategy": kb.chunking_strategy,
        }

    def query(self, db: Session, user_id: str, knowledge_id: str, q: str, n_results: int = 5, file_ids: Optional[List[str]] = None) -> List[dict]:
        self._get_or_404(db, user_id, knowledge_id)
        from src.services.chroma_service import chroma_service
        results = chroma_service.query_knowledge(knowledge_id, q, n_results, file_ids=file_ids)
        return results

    # ------------------------------------------------------------------

    def _get_or_404(self, db: Session, user_id: str, knowledge_id: str) -> Knowledge:
        kb = db.query(Knowledge).filter(Knowledge.id == knowledge_id, Knowledge.user_id == user_id).first()
        if not kb:
            raise NotFoundError("Knowledge base not found")
        return kb


knowledge_service = KnowledgeService()
