from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.middleware.auth import get_current_user
from src.services.note_service import note_service
from src.db.models import User

router = APIRouter()


class CreateNoteSchema(BaseModel):
    title: str
    content: Optional[str] = ""
    visibility: Optional[str] = "private"
    tags: Optional[List[str]] = None
    folderId: Optional[str] = None


class UpdateNoteSchema(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    visibility: Optional[str] = None
    tags: Optional[List[str]] = None
    folderId: Optional[str] = None


class ArchiveSchema(BaseModel):
    archived: bool = True


class PinSchema(BaseModel):
    pinned: bool = True


@router.get("/shared/{share_id}")
def get_shared_note(share_id: str, db: Session = Depends(get_db)):
    return note_service.get_note_by_share_id(db, share_id)


@router.get("")
def list_notes(
    archived: Optional[str] = None,
    pinned: Optional[str] = None,
    folderId: Optional[str] = None,
    search: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    filters = {}
    if archived is not None:
        filters["archived"] = archived == "true"
    if pinned is not None:
        filters["pinned"] = pinned == "true"
    if folderId is not None:
        filters["folderId"] = folderId or None
    if search:
        filters["search"] = search
    return note_service.get_notes(db, user.id, filters)


@router.post("")
def create_note(data: CreateNoteSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return note_service.create_note(db, user.id, data.model_dump())


@router.get("/{note_id}")
def get_note(note_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return note_service.get_note_by_id(db, note_id, user.id)


@router.put("/{note_id}")
def update_note(note_id: str, data: UpdateNoteSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return note_service.update_note(db, note_id, user.id, data.model_dump(exclude_none=True))


@router.delete("/{note_id}")
def delete_note(note_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note_service.delete_note(db, note_id, user.id)
    return {"message": "Note deleted"}


@router.put("/{note_id}/archive")
def archive_note(note_id: str, data: ArchiveSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return note_service.archive_note(db, note_id, user.id, data.archived)


@router.put("/{note_id}/pin")
def pin_note(note_id: str, data: PinSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return note_service.pin_note(db, note_id, user.id, data.pinned)


@router.post("/{note_id}/share")
def share_note(note_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return note_service.share_note(db, note_id, user.id)


@router.delete("/{note_id}/share")
def unshare_note(note_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note_service.unshare_note(db, note_id, user.id)
    return {"message": "Note unshared"}
