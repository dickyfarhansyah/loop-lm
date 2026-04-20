from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.middleware.auth import require_admin
from src.services.group_service import group_service
from src.db.models import User

router = APIRouter()


class CreateGroupSchema(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: Optional[dict] = None


class UpdateGroupSchema(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[dict] = None


class AddMemberSchema(BaseModel):
    userId: str


# ── Specific paths BEFORE /{group_id} to avoid shadowing ──────────────────────

@router.get("/memberships")
def get_all_memberships(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return group_service.get_all_memberships(db)


@router.get("/users/{user_id}")
def get_user_groups(user_id: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return group_service.get_user_groups(db, user_id)


# ── Group CRUD ─────────────────────────────────────────────────────────────────

@router.get("")
def list_groups(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return group_service.get_groups(db)


@router.post("", status_code=201)
def create_group(data: CreateGroupSchema, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return group_service.create_group(db, data.model_dump(exclude_none=True))


@router.get("/{group_id}")
def get_group(group_id: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    group = group_service.get_group_by_id(db, group_id)
    return group_service._serialize(group)


@router.put("/{group_id}")
def update_group(group_id: str, data: UpdateGroupSchema, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return group_service.update_group(db, group_id, data.model_dump(exclude_none=True))


@router.delete("/{group_id}")
def delete_group(group_id: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    group_service.delete_group(db, group_id)
    return {"message": "Group deleted"}


# ── Members ────────────────────────────────────────────────────────────────────

@router.get("/{group_id}/members")
def get_group_members(group_id: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return group_service.get_group_members(db, group_id)


@router.post("/{group_id}/members")
def add_member(group_id: str, data: AddMemberSchema, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    group_service.add_member(db, group_id, data.userId)
    return {"message": "Member added"}


@router.delete("/{group_id}/members/{user_id}")
def remove_member(group_id: str, user_id: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    group_service.remove_member(db, group_id, user_id)
    return {"message": "Member removed"}
