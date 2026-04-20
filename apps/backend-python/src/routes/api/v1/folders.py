from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.middleware.auth import get_current_user
from src.services.folder_service import folder_service
from src.db.models import User

router = APIRouter()


class CreateFolderSchema(BaseModel):
    name: str
    parentId: Optional[str] = None


class UpdateFolderSchema(BaseModel):
    name: Optional[str] = None
    parentId: Optional[str] = None
    isExpanded: Optional[bool] = None


@router.post("")
def create_folder(data: CreateFolderSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return folder_service.create_folder(db, user.id, data.name, data.parentId)


@router.get("")
def list_folders(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return folder_service.get_folders(db, user.id)


@router.get("/{folder_id}")
def get_folder(folder_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return folder_service.get_folder_by_id(db, folder_id, user.id)


@router.put("/{folder_id}")
def update_folder(folder_id: str, data: UpdateFolderSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return folder_service.update_folder(db, folder_id, user.id, data.model_dump(exclude_none=True))


@router.delete("/{folder_id}")
def delete_folder(folder_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    folder_service.delete_folder(db, folder_id, user.id)
    return {"message": "Folder deleted"}
