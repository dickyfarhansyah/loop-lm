import json
from datetime import datetime
from nanoid import generate
from sqlalchemy.orm import Session
from src.db.models import Note
from src.utils.errors import NotFoundError


def _serialize(note: Note) -> dict:
    return {
        "id": note.id,
        "userId": note.user_id,
        "title": note.title,
        "content": note.content,
        "plainText": note.plain_text,
        "visibility": note.visibility,
        "wordCount": note.word_count,
        "charCount": note.char_count,
        "tags": json.loads(note.tags) if isinstance(note.tags, str) and note.tags else [],
        "folderId": note.folder_id,
        "archived": note.archived,
        "pinned": note.pinned,
        "shareId": note.share_id,
        "createdAt": note.created_at.isoformat() if note.created_at else None,
        "updatedAt": note.updated_at.isoformat() if note.updated_at else None,
    }


def _strip_html(html: str) -> str:
    import re
    return re.sub(r"<[^>]+>", "", html)


class NoteService:
    def create_note(self, db: Session, user_id: str, data: dict) -> dict:
        now = datetime.utcnow()
        content = data.get("content", "")
        plain = _strip_html(content)
        note = Note(
            id=generate(), user_id=user_id,
            title=data["title"], content=content, plain_text=plain,
            visibility=data.get("visibility", "private"),
            word_count=len(plain.split()),
            char_count=len(plain),
            tags=json.dumps(data.get("tags", [])),
            folder_id=data.get("folderId"),
            created_at=now, updated_at=now,
        )
        db.add(note)
        db.commit()
        db.refresh(note)
        return _serialize(note)

    def get_notes(self, db: Session, user_id: str, filters: dict = None) -> list:
        q = db.query(Note).filter(Note.user_id == user_id)
        if filters:
            if "archived" in filters:
                q = q.filter(Note.archived == filters["archived"])
            if "pinned" in filters:
                q = q.filter(Note.pinned == filters["pinned"])
            if "folderId" in filters:
                q = q.filter(Note.folder_id == filters["folderId"])
            if "search" in filters:
                term = f"%{filters['search']}%"
                q = q.filter(Note.title.ilike(term) | Note.plain_text.ilike(term))
        notes = q.order_by(Note.updated_at.desc()).all()
        return [_serialize(n) for n in notes]

    def get_note_by_id(self, db: Session, note_id: str, user_id: str) -> dict:
        note = db.query(Note).filter(Note.id == note_id, Note.user_id == user_id).first()
        if not note:
            raise NotFoundError("Note not found")
        return _serialize(note)

    def get_note_by_share_id(self, db: Session, share_id: str) -> dict:
        note = db.query(Note).filter(Note.share_id == share_id).first()
        if not note:
            raise NotFoundError("Note not found")
        return _serialize(note)

    def update_note(self, db: Session, note_id: str, user_id: str, data: dict) -> dict:
        note = db.query(Note).filter(Note.id == note_id, Note.user_id == user_id).first()
        if not note:
            raise NotFoundError("Note not found")
        if "title" in data:
            note.title = data["title"]
        if "content" in data:
            note.content = data["content"]
            plain = _strip_html(data["content"])
            note.plain_text = plain
            note.word_count = len(plain.split())
            note.char_count = len(plain)
        if "visibility" in data:
            note.visibility = data["visibility"]
        if "tags" in data:
            note.tags = json.dumps(data["tags"])
        if "folderId" in data:
            note.folder_id = data["folderId"]
        note.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(note)
        return _serialize(note)

    def delete_note(self, db: Session, note_id: str, user_id: str) -> None:
        note = db.query(Note).filter(Note.id == note_id, Note.user_id == user_id).first()
        if not note:
            raise NotFoundError("Note not found")
        db.delete(note)
        db.commit()

    def archive_note(self, db: Session, note_id: str, user_id: str, archived: bool) -> dict:
        note = db.query(Note).filter(Note.id == note_id, Note.user_id == user_id).first()
        if not note:
            raise NotFoundError("Note not found")
        note.archived = archived
        note.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(note)
        return _serialize(note)

    def pin_note(self, db: Session, note_id: str, user_id: str, pinned: bool) -> dict:
        note = db.query(Note).filter(Note.id == note_id, Note.user_id == user_id).first()
        if not note:
            raise NotFoundError("Note not found")
        note.pinned = pinned
        note.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(note)
        return _serialize(note)

    def share_note(self, db: Session, note_id: str, user_id: str) -> dict:
        note = db.query(Note).filter(Note.id == note_id, Note.user_id == user_id).first()
        if not note:
            raise NotFoundError("Note not found")
        if not note.share_id:
            note.share_id = generate()
            note.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(note)
        return {"shareId": note.share_id}

    def unshare_note(self, db: Session, note_id: str, user_id: str) -> None:
        note = db.query(Note).filter(Note.id == note_id, Note.user_id == user_id).first()
        if not note:
            raise NotFoundError("Note not found")
        note.share_id = None
        note.updated_at = datetime.utcnow()
        db.commit()


note_service = NoteService()
