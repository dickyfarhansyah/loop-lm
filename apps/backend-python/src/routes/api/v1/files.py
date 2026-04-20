from fastapi import APIRouter, Depends, UploadFile, File as FastAPIFile
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.middleware.auth import get_current_user
from src.services.file_service import file_service
from src.services.chroma_service import chroma_service
from src.db.models import User
from src.utils.errors import BadRequestError, NotFoundError

router = APIRouter()


class AttachSchema(BaseModel):
    chatId: str
    fileId: str
    messageId: Optional[str] = None


class SearchSchema(BaseModel):
    query: str
    fileIds: Optional[List[str]] = None
    nResults: int = 5


@router.post("")
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = await file.read()
    return file_service.upload_file(db, {
        "filename": file.filename,
        "data": data,
        "mimetype": file.content_type,
    }, user.id)


@router.get("")
def list_files(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return file_service.get_files(db, user.id)


@router.get("/{file_id}")
def get_file(file_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return file_service.get_file_by_id(db, file_id, user.id)


@router.get("/{file_id}/status")
def get_file_status(file_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Poll processing status after POST /parse. Returns status: processing | processed | error"""
    return file_service.get_file_status(db, file_id, user.id)


@router.get("/{file_id}/download")
def download_file(file_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data, filename, meta = file_service.download_file(db, file_id, user.id)
    return Response(
        content=data,
        media_type=meta.get("mimetype", "application/octet-stream"),
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{file_id}/content")
def serve_file_inline(file_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Serve file inline (for PDF preview in browser)."""
    data, filename, meta = file_service.download_file(db, file_id, user.id)
    return Response(
        content=data,
        media_type=meta.get("mimetype", "application/octet-stream"),
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )


@router.get("/{file_id}/public")
def serve_file_public(file_id: str, db: Session = Depends(get_db)):
    """Serve image files publicly (no auth). Used for app logos stored in settings."""
    data, filename, meta = file_service.download_file_public(db, file_id)
    mimetype = meta.get("mimetype", "application/octet-stream")
    if not mimetype.startswith("image/"):
        raise BadRequestError("Only image files can be served publicly")
    return Response(
        content=data,
        media_type=mimetype,
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )


@router.delete("/{file_id}")
def delete_file(file_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    file_service.delete_file(db, file_id, user.id)
    return {"message": "File deleted"}


@router.post("/attach")
def attach_file(data: AttachSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return file_service.attach_file_to_chat(db, data.chatId, data.fileId, user.id, data.messageId)


@router.post("/parse")
async def parse_document(
    file: UploadFile = FastAPIFile(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file_service.is_supported_document(file.content_type):
        raise BadRequestError(f"Unsupported document format: {file.content_type}")
    data = await file.read()
    return file_service.upload_and_parse_document(db, {
        "filename": file.filename,
        "data": data,
        "mimetype": file.content_type,
    }, user.id)


@router.post("/search")
def rag_search(data: SearchSchema, user: User = Depends(get_current_user)):
    if not data.query:
        raise BadRequestError("query is required")
    results = chroma_service.query_chunks(data.query, user.id, data.fileIds, data.nResults)
    return {
        "results": [
            {"id": r.id, "text": r.text, "metadata": r.metadata, "distance": r.distance}
            for r in results
        ]
    }


@router.delete("/chunks")
def delete_user_chunks(user: User = Depends(get_current_user)):
    chroma_service.delete_user_chunks(user.id)
    return {"message": "All document chunks deleted"}


@router.delete("/{file_id}/chunks")
def delete_file_chunks(file_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify file belongs to user
    file_service.get_file_by_id(db, file_id, user.id)
    chroma_service.delete_file_chunks(file_id)
    return {"message": "File chunks deleted"}
