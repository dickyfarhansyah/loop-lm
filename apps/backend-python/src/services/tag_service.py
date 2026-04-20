from __future__ import annotations
import json
from datetime import datetime
from nanoid import generate
from sqlalchemy.orm import Session
from src.db.models import Tag
from src.utils.errors import NotFoundError


def _serialize(tag: Tag) -> dict:
    return {
        "id": tag.id,
        "userId": tag.user_id,
        "name": tag.name,
        "data": json.loads(tag.data) if isinstance(tag.data, str) and tag.data else None,
        "createdAt": tag.created_at.isoformat() if tag.created_at else None,
        "updatedAt": tag.updated_at.isoformat() if tag.updated_at else None,
    }


class TagService:
    def create_tag(self, db: Session, user_id: str, name: str, data: dict | None = None) -> dict:
        now = datetime.utcnow()
        tag = Tag(
            id=generate(), user_id=user_id, name=name,
            data=json.dumps(data) if data else None,
            created_at=now, updated_at=now,
        )
        db.add(tag)
        db.commit()
        db.refresh(tag)
        return _serialize(tag)

    def get_tags(self, db: Session, user_id: str) -> list:
        tags = db.query(Tag).filter(Tag.user_id == user_id).all()
        return [_serialize(t) for t in tags]

    def get_tag_by_id(self, db: Session, tag_id: str, user_id: str) -> dict:
        tag = db.query(Tag).filter(Tag.id == tag_id, Tag.user_id == user_id).first()
        if not tag:
            raise NotFoundError("Tag not found")
        return _serialize(tag)

    def delete_tag(self, db: Session, tag_id: str, user_id: str) -> None:
        tag = db.query(Tag).filter(Tag.id == tag_id, Tag.user_id == user_id).first()
        if not tag:
            raise NotFoundError("Tag not found")
        db.delete(tag)
        db.commit()


tag_service = TagService()
