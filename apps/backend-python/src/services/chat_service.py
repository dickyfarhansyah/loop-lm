from __future__ import annotations
import json
import logging
import threading
from datetime import datetime, timezone
from nanoid import generate
from sqlalchemy.orm import Session
from src.db.models import Chat, ChatFile, Note
from src.utils.errors import NotFoundError, ForbiddenError

logger = logging.getLogger(__name__)


def _serialize_chat(chat: Chat) -> dict:
    return {
        "id": chat.id,
        "userId": chat.user_id,
        "title": chat.title,
        "chat": json.loads(chat.chat) if isinstance(chat.chat, str) else chat.chat,
        "shareId": chat.share_id,
        "archived": chat.archived,
        "pinned": chat.pinned,
        "folderId": chat.folder_id,
        "meta": json.loads(chat.meta) if isinstance(chat.meta, str) and chat.meta else {},
        "createdAt": chat.created_at.isoformat() if chat.created_at else None,
        "updatedAt": chat.updated_at.isoformat() if chat.updated_at else None,
    }


class ChatService:
    def create_chat(self, db: Session, user_id: str, title: str) -> dict:
        now = datetime.utcnow()
        chat = Chat(
            id=generate(), user_id=user_id, title=title,
            chat=json.dumps({"messages": [], "history": {}}),
            created_at=now, updated_at=now,
        )
        db.add(chat)
        db.commit()
        db.refresh(chat)
        return _serialize_chat(chat)

    def get_chats(self, db: Session, user_id: str, filters: dict = None) -> list:
        q = db.query(Chat).filter(Chat.user_id == user_id)
        if filters:
            if "archived" in filters:
                q = q.filter(Chat.archived == filters["archived"])
            if "pinned" in filters:
                q = q.filter(Chat.pinned == filters["pinned"])
            if "folderId" in filters:
                q = q.filter(Chat.folder_id == filters["folderId"])
        chats = q.order_by(Chat.updated_at.desc()).all()
        return [_serialize_chat(c) for c in chats]

    def get_chat_by_id(self, db: Session, chat_id: str, user_id: str) -> dict:
        chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user_id).first()
        if not chat:
            raise NotFoundError("Chat not found")
        return _serialize_chat(chat)

    def get_chat_by_share_id(self, db: Session, share_id: str) -> dict:
        chat = db.query(Chat).filter(Chat.share_id == share_id).first()
        if not chat:
            raise NotFoundError("Chat not found")
        return _serialize_chat(chat)

    def update_chat(self, db: Session, chat_id: str, user_id: str, data: dict) -> dict:
        chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user_id).first()
        if not chat:
            raise NotFoundError("Chat not found")
        for key, val in data.items():
            if key == "title":
                chat.title = val
            elif key == "chat":
                chat.chat = json.dumps(val) if isinstance(val, dict) else val
            elif key == "folderId":
                chat.folder_id = val
            elif key == "meta":
                chat.meta = json.dumps(val) if isinstance(val, dict) else val
        chat.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(chat)
        return _serialize_chat(chat)

    def delete_chat(self, db: Session, chat_id: str, user_id: str) -> None:
        chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user_id).first()
        if not chat:
            raise NotFoundError("Chat not found")
        db.delete(chat)
        db.commit()

    def add_message(self, db: Session, chat_id: str, user_id: str, message_data: dict) -> dict:
        chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user_id).first()
        if not chat:
            raise NotFoundError("Chat not found")
        if "notes" in message_data:
            message_data["notes"] = self._normalize_notes(db, user_id, message_data.get("notes"))
        chat_data = json.loads(chat.chat) if isinstance(chat.chat, str) else chat.chat
        if not isinstance(chat_data, dict):
            chat_data = {}
        message_id = generate()
        now_utc = datetime.now(timezone.utc)
        message = {
            "id": message_id,
            **message_data,
            "timestamp": int(now_utc.timestamp() * 1000),  # Unix ms, required by frontend
            "createdAt": now_utc.isoformat(),
        }
        if "messages" not in chat_data:
            chat_data["messages"] = []
        chat_data["messages"].append(message)

        message_count = len(chat_data["messages"])
        has_default_title = chat.title in ("New Chat", "", None)
        is_user = message_data.get("role") == "user"
        is_assistant = message_data.get("role") == "assistant"
        should_generate_title = is_user and has_default_title and message_count <= 2

        chat.chat = json.dumps(chat_data)
        chat.updated_at = datetime.utcnow()
        db.commit()

        model = message_data.get("model")

        # Generate title in background so addMessage returns immediately
        if should_generate_title:
            logger.info(f"[title] Triggering background title generation for chat={chat_id} model={model}")
            messages_snapshot = [
                {"role": m.get("role"), "content": m.get("content", "")}
                for m in chat_data["messages"]
            ]
            thread = threading.Thread(
                target=self._generate_and_save_title,
                args=(chat_id, user_id, messages_snapshot, model),
                daemon=True,
            )
            thread.start()
            logger.info(f"[title] Background thread started")
        else:
            logger.debug(f"[title] Skip: is_user={is_user} has_default_title={has_default_title} message_count={message_count}")

        # Generate follow-up suggestions synchronously for assistant messages
        # (must be synchronous so suggestions are present when frontend refetches)
        if is_assistant:
            try:
                from src.services.suggestion_service import suggestion_service
                recent_messages = [
                    {"role": m.get("role"), "content": m.get("content", "")}
                    for m in chat_data["messages"][-5:]
                ]
                suggestions = suggestion_service.generate_suggestions(
                    db, user_id, recent_messages, message_data.get("content", ""), model
                )
                if suggestions:
                    message["suggestions"] = suggestions
                    # Update the saved record in DB with suggestions
                    for msg in chat_data["messages"]:
                        if msg.get("id") == message_id:
                            msg["suggestions"] = suggestions
                            break
                    chat.chat = json.dumps(chat_data)
                    chat.updated_at = datetime.utcnow()
                    db.commit()
                    logger.info(f"[suggestion] ✅ Saved {len(suggestions)} suggestions for message={message_id}")
            except Exception as e:
                logger.error(f"[suggestion] ❌ Failed to generate suggestions: {e}", exc_info=True)

        return message

    def _generate_and_save_title(self, chat_id: str, user_id: str, messages: list, model: str | None) -> None:
        from src.config.database import SessionLocal
        from src.services.title_service import title_service
        logger.info(f"[title] Background thread running for chat={chat_id} model={model}")
        db = SessionLocal()
        try:
            new_title = title_service.generate_title(db, user_id, messages, model)
            logger.info(f"[title] AI returned: '{new_title}'")
            chat = db.query(Chat).filter(Chat.id == chat_id).first()
            if chat and chat.title in ("New Chat", "", None):
                chat.title = new_title
                chat.updated_at = datetime.utcnow()
                db.commit()
                logger.info(f"[title] ✅ Saved: '{new_title}' → chat {chat_id}")
            else:
                logger.info(f"[title] Skip save: current title={chat.title!r}")
        except Exception as e:
            logger.error(f"[title] ❌ Failed: {e}", exc_info=True)
        finally:
            db.close()
            logger.info(f"[title] Background thread done for chat={chat_id}")

    def update_message(self, db: Session, chat_id: str, user_id: str, message_id: str, content: str) -> dict:
        chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user_id).first()
        if not chat:
            raise NotFoundError("Chat not found")
        chat_data = json.loads(chat.chat) if isinstance(chat.chat, str) else chat.chat
        for msg in chat_data.get("messages", []):
            if msg.get("id") == message_id:
                msg["content"] = content
                msg["updatedAt"] = datetime.utcnow().isoformat()
                chat.chat = json.dumps(chat_data)
                chat.updated_at = datetime.utcnow()
                db.commit()
                return msg
        raise NotFoundError("Message not found")

    def archive_chat(self, db: Session, chat_id: str, user_id: str, archived: bool) -> dict:
        chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user_id).first()
        if not chat:
            raise NotFoundError("Chat not found")
        chat.archived = archived
        chat.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(chat)
        return _serialize_chat(chat)

    def pin_chat(self, db: Session, chat_id: str, user_id: str, pinned: bool) -> dict:
        chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user_id).first()
        if not chat:
            raise NotFoundError("Chat not found")
        chat.pinned = pinned
        chat.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(chat)
        return _serialize_chat(chat)

    def share_chat(self, db: Session, chat_id: str, user_id: str) -> dict:
        chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user_id).first()
        if not chat:
            raise NotFoundError("Chat not found")
        if not chat.share_id:
            chat.share_id = generate()
            chat.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(chat)
        return {"shareId": chat.share_id}

    def unshare_chat(self, db: Session, chat_id: str, user_id: str) -> None:
        chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user_id).first()
        if not chat:
            raise NotFoundError("Chat not found")
        chat.share_id = None
        chat.updated_at = datetime.utcnow()
        db.commit()

    def _normalize_notes(self, db: Session, user_id: str, notes: list | None) -> list:
        if not notes:
            return []

        note_ids = [
            item.get("id")
            for item in notes
            if isinstance(item, dict) and item.get("id")
        ]

        if not note_ids:
            return []

        db_notes = (
            db.query(Note)
            .filter(Note.user_id == user_id, Note.id.in_(note_ids))
            .all()
        )
        note_map = {note.id: note for note in db_notes}

        normalized = []
        for item in notes:
            if not isinstance(item, dict):
                continue

            note = note_map.get(item.get("id"))
            if not note:
                continue

            normalized.append({
                "id": note.id,
                "title": note.title,
                "shareId": note.share_id,
            })

        return normalized
chat_service = ChatService()
