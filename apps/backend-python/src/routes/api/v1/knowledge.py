from fastapi import APIRouter, Depends, UploadFile, File as FastAPIFile
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session

from src.config.database import get_db
from src.middleware.auth import get_current_user
from src.services.knowledge_service import knowledge_service
from src.services.chunking_service import CHUNKING_STRATEGY_CONFIGS
from src.db.models import User
from src.utils.errors import BadRequestError

router = APIRouter()


# --------------------------------------------------------------------------
# Schemas
# --------------------------------------------------------------------------

class CreateKnowledgeSchema(BaseModel):
    name: str
    description: Optional[str] = ""
    chunkingStrategy: Optional[str] = "default"


class UpdateKnowledgeSchema(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    chunkingStrategy: Optional[str] = None


class AddFileSchema(BaseModel):
    fileId: str


class BatchAddFilesSchema(BaseModel):
    fileIds: List[str]


class QuerySchema(BaseModel):
    query: str
    nResults: int = 5
    fileIds: Optional[List[str]] = None


# --------------------------------------------------------------------------
# Knowledge CRUD
# --------------------------------------------------------------------------

@router.get("/strategies")
def list_chunking_strategies():
    """Return all available chunking strategies with label and description."""
    return [
        {"value": k.value, "label": v["label"], "description": v["description"]}
        for k, v in CHUNKING_STRATEGY_CONFIGS.items()
    ]


@router.get("")
def list_knowledge(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return knowledge_service.list(db, user.id)


@router.post("")
def create_knowledge(
    body: CreateKnowledgeSchema,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return knowledge_service.create(db, user.id, body.name, body.description or "", body.chunkingStrategy or "default")


@router.get("/{knowledge_id}")
def get_knowledge(
    knowledge_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return knowledge_service.get(db, user.id, knowledge_id)


@router.put("/{knowledge_id}")
def update_knowledge(
    knowledge_id: str,
    body: UpdateKnowledgeSchema,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return knowledge_service.update(db, user.id, knowledge_id, body.name, body.description, body.chunkingStrategy)


@router.delete("/{knowledge_id}")
def delete_knowledge(
    knowledge_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    knowledge_service.delete(db, user.id, knowledge_id)
    return {"message": "Knowledge base deleted"}


@router.get("/{knowledge_id}/stats")
def knowledge_stats(
    knowledge_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return total files, total chunks and per-status breakdown."""
    return knowledge_service.stats(db, user.id, knowledge_id)


# --------------------------------------------------------------------------
# Files within a knowledge base
# --------------------------------------------------------------------------

@router.get("/{knowledge_id}/files")
def list_knowledge_files(
    knowledge_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return knowledge_service.list_files(db, user.id, knowledge_id)


@router.post("/{knowledge_id}/files")
def add_file_to_knowledge(
    knowledge_id: str,
    body: AddFileSchema,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Link an already-uploaded file to a knowledge base."""
    return knowledge_service.add_file(db, user.id, knowledge_id, body.fileId)


@router.post("/{knowledge_id}/files/batch")
def batch_add_files_to_knowledge(
    knowledge_id: str,
    body: BatchAddFilesSchema,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Link multiple already-uploaded files to a knowledge base at once."""
    if not body.fileIds:
        raise BadRequestError("fileIds is required")
    return knowledge_service.batch_add_files(db, user.id, knowledge_id, body.fileIds)


@router.post("/{knowledge_id}/files/upload")
async def upload_file_to_knowledge(
    knowledge_id: str,
    file: UploadFile = FastAPIFile(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a new file and immediately add it to the knowledge base."""
    if not file.content_type:
        raise BadRequestError("File content type is required")
    data = await file.read()
    return knowledge_service.upload_and_add_file(
        db,
        user.id,
        knowledge_id,
        {"filename": file.filename, "data": data, "mimetype": file.content_type},
    )


@router.delete("/{knowledge_id}/files/{file_id}")
def remove_file_from_knowledge(
    knowledge_id: str,
    file_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    knowledge_service.remove_file(db, user.id, knowledge_id, file_id)
    return {"message": "File removed from knowledge base"}


@router.get("/{knowledge_id}/files/{file_id}/preview")
def preview_file_chunks(
    knowledge_id: str,
    file_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Preview how the file would be chunked with the current strategy (no re-embedding)."""
    return knowledge_service.preview_chunks(db, user.id, knowledge_id, file_id)


@router.post("/{knowledge_id}/files/{file_id}/reindex")
def reindex_file_in_knowledge(
    knowledge_id: str,
    file_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Re-trigger background embedding for a file that failed to index."""
    return knowledge_service.reindex_file(db, user.id, knowledge_id, file_id)


# --------------------------------------------------------------------------
# Query / RAG
# --------------------------------------------------------------------------

@router.post("/{knowledge_id}/query")
def query_knowledge(
    knowledge_id: str,
    body: QuerySchema,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not body.query.strip():
        raise BadRequestError("query is required")
    results = knowledge_service.query(db, user.id, knowledge_id, body.query, body.nResults, body.fileIds)
    return {"results": results}
