from __future__ import annotations
import json
from datetime import datetime
from nanoid import generate
from sqlalchemy.orm import Session
from src.db.models import Folder
from src.utils.errors import NotFoundError


def _serialize(folder: Folder) -> dict:
    return {
        "id": folder.id,
        "userId": folder.user_id,
        "parentId": folder.parent_id,
        "name": folder.name,
        "isExpanded": folder.is_expanded,
        "meta": json.loads(folder.meta) if isinstance(folder.meta, str) and folder.meta else None,
        "createdAt": folder.created_at.isoformat() if folder.created_at else None,
        "updatedAt": folder.updated_at.isoformat() if folder.updated_at else None,
    }


class FolderService:
    def create_folder(self, db: Session, user_id: str, name: str, parent_id: str | None = None) -> dict:
        now = datetime.utcnow()
        folder = Folder(id=generate(), user_id=user_id, name=name, parent_id=parent_id, created_at=now, updated_at=now)
        db.add(folder)
        db.commit()
        db.refresh(folder)
        return _serialize(folder)

    def get_folders(self, db: Session, user_id: str) -> list:
        folders = db.query(Folder).filter(Folder.user_id == user_id).all()
        return [_serialize(f) for f in folders]

    def get_folder_by_id(self, db: Session, folder_id: str, user_id: str) -> dict:
        folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == user_id).first()
        if not folder:
            raise NotFoundError("Folder not found")
        return _serialize(folder)

    def update_folder(self, db: Session, folder_id: str, user_id: str, data: dict) -> dict:
        folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == user_id).first()
        if not folder:
            raise NotFoundError("Folder not found")
        if "name" in data:
            folder.name = data["name"]
        if "parentId" in data:
            folder.parent_id = data["parentId"]
        if "isExpanded" in data:
            folder.is_expanded = data["isExpanded"]
        folder.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(folder)
        return _serialize(folder)

    def delete_folder(self, db: Session, folder_id: str, user_id: str) -> None:
        folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == user_id).first()
        if not folder:
            raise NotFoundError("Folder not found")
        db.delete(folder)
        db.commit()


folder_service = FolderService()
