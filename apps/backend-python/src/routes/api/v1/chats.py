from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
import httpx
from src.config.database import get_db
from src.middleware.auth import get_current_user
from src.services.chat_service import chat_service
from src.services.proxy_service import (
    _get_connection_by_model,
    _get_default_connection,
    _build_headers,
    _chat_url,
)
from src.db.models import User

router = APIRouter()


class CreateChatSchema(BaseModel):
    title: str


class UpdateChatSchema(BaseModel):
    title: Optional[str] = None
    chat: Optional[dict] = None
    folderId: Optional[str] = None
    meta: Optional[dict] = None


class AddMessageSchema(BaseModel):
    role: str
    content: str
    model: Optional[str] = None
    images: Optional[list] = None
    sources: Optional[list] = None


class UpdateMessageSchema(BaseModel):
    content: str


class ArchiveSchema(BaseModel):
    archived: bool = True


class PinSchema(BaseModel):
    pinned: bool = True


class GenerateTitleSchema(BaseModel):
    model: str
    message: str


@router.post("")
def create_chat(data: CreateChatSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return chat_service.create_chat(db, user.id, data.title)


@router.get("")
def list_chats(
    folderId: Optional[str] = None,
    archived: Optional[str] = None,
    pinned: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    filters = {}
    if folderId is not None:
        filters["folderId"] = folderId or None
    if archived is not None:
        filters["archived"] = archived == "true"
    if pinned is not None:
        filters["pinned"] = pinned == "true"
    return chat_service.get_chats(db, user.id, filters)


@router.get("/shared/{share_id}")
def get_shared_chat(share_id: str, db: Session = Depends(get_db)):
    return chat_service.get_chat_by_share_id(db, share_id)


@router.get("/{chat_id}")
def get_chat(chat_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return chat_service.get_chat_by_id(db, chat_id, user.id)


@router.put("/{chat_id}")
def update_chat(chat_id: str, data: UpdateChatSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return chat_service.update_chat(db, chat_id, user.id, data.model_dump(exclude_none=True))


@router.delete("/{chat_id}")
def delete_chat(chat_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    chat_service.delete_chat(db, chat_id, user.id)
    return {"message": "Chat deleted"}


@router.post("/{chat_id}/messages")
def add_message(chat_id: str, data: AddMessageSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return chat_service.add_message(db, chat_id, user.id, data.model_dump(exclude_none=True))


@router.put("/{chat_id}/messages/{message_id}")
def update_message(chat_id: str, message_id: str, data: UpdateMessageSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return chat_service.update_message(db, chat_id, user.id, message_id, data.content)


@router.put("/{chat_id}/archive")
def archive_chat(chat_id: str, data: ArchiveSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return chat_service.archive_chat(db, chat_id, user.id, data.archived)


@router.put("/{chat_id}/pin")
def pin_chat(chat_id: str, data: PinSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return chat_service.pin_chat(db, chat_id, user.id, data.pinned)


@router.post("/{chat_id}/share")
def share_chat(chat_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return chat_service.share_chat(db, chat_id, user.id)


@router.delete("/{chat_id}/share")
def unshare_chat(chat_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    chat_service.unshare_chat(db, chat_id, user.id)
    return {"message": "Chat unshared"}


@router.post("/{chat_id}/title/generate")
def generate_chat_title(
    chat_id: str,
    data: GenerateTitleSchema,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Call AI to generate a short title for the chat, update and return it."""
    try:
        conn = (
            _get_connection_by_model(db, user.id, data.model)
            if data.model
            else _get_default_connection(db, user.id)
        )
        resp = httpx.post(
            _chat_url(conn),
            json={
                "model": data.model,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a title generator. Your only job is to create a short chat session title "
                            "based on the topic of the user's message below. "
                            "Rules: maximum 5 words, start with one relevant emoji, no quotes, no punctuation at the end, "
                            "do NOT answer the user's question, do NOT introduce yourself, "
                            "respond with ONLY the title text and nothing else."
                        ),
                    },
                    {
                        "role": "user",
                        "content": f"Generate a title for a conversation that starts with this message: {data.message[:500]}",
                    },
                ],
                "stream": False,
                "max_tokens": 20,
            },
            headers=_build_headers(conn),
            timeout=30.0,
        )
        resp.raise_for_status()
        title = (
            resp.json()
            .get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
        )
    except Exception:
        title = data.message[:50].strip()

    if title:
        chat_service.update_chat(db, chat_id, user.id, {"title": title})
    return {"title": title}
