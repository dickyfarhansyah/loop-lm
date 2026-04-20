from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.middleware.auth import get_current_user, require_admin
from src.services.user_service import user_service
from src.db.models import User

router = APIRouter()


class UpdateUserSchema(BaseModel):
    name: Optional[str] = None
    profileImageUrl: Optional[str] = None
    bio: Optional[str] = None
    username: Optional[str] = None


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return user_service.get_user_by_id(db, current_user.id)


@router.put("/me")
def update_me(data: UpdateUserSchema, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return user_service.update_user(db, current_user.id, data.model_dump(exclude_none=True))


@router.get("/me/api-key")
def get_api_key(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"apiKey": user_service.get_user_api_key(db, current_user.id)}


@router.post("/me/api-key")
def generate_api_key(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    key = user_service.generate_user_api_key(db, current_user.id)
    return {"apiKey": key}


@router.delete("/me/api-key")
def delete_api_key(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_service.delete_user_api_key(db, current_user.id)
    return {"message": "API key deleted"}


@router.get("")
def list_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return user_service.get_users(db)


@router.get("/{user_id}")
def get_user(user_id: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return user_service.get_user_by_id(db, user_id)


@router.put("/{user_id}")
def update_user(user_id: str, data: UpdateUserSchema, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return user_service.update_user(db, user_id, data.model_dump(exclude_none=True))


@router.delete("/{user_id}")
def delete_user(user_id: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    user_service.delete_user(db, user_id)
    return {"message": "User deleted"}
