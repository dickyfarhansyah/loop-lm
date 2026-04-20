from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.middleware.auth import get_current_user
from src.services.tag_service import tag_service
from src.db.models import User

router = APIRouter()


class CreateTagSchema(BaseModel):
    name: str
    data: Optional[dict] = None


@router.post("")
def create_tag(data: CreateTagSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return tag_service.create_tag(db, user.id, data.name, data.data)


@router.get("")
def list_tags(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return tag_service.get_tags(db, user.id)


@router.get("/{tag_id}")
def get_tag(tag_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return tag_service.get_tag_by_id(db, tag_id, user.id)


@router.delete("/{tag_id}")
def delete_tag(tag_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tag_service.delete_tag(db, tag_id, user.id)
    return {"message": "Tag deleted"}
