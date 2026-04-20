from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Any
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.middleware.auth import get_current_user, require_admin
from src.services.settings_service import settings_service
from src.db.models import User

router = APIRouter()


class SetValueSchema(BaseModel):
    value: Any


@router.get("")
def get_all(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return settings_service.get_all_settings(db)


@router.get("/categories")
def get_categories(admin: User = Depends(require_admin)):
    return {"categories": settings_service.get_categories()}


# Public: needed for login page (enable_signup etc.)
@router.get("/{category}")
def get_by_category(category: str, db: Session = Depends(get_db)):
    return settings_service.get_settings_by_category(db, category)


@router.put("/{category}")
def update_category(category: str, data: dict, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return settings_service.update_category_settings(db, category, data)


@router.delete("/{category}")
def reset_category(category: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    settings_service.reset_category(db, category)
    return {"message": f"Settings for {category} reset to defaults"}


@router.get("/{category}/{key}")
def get_setting(category: str, key: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    value = settings_service.get_setting(db, category, key)
    return {"category": category, "key": key, "value": value}


@router.put("/{category}/{key}")
def set_setting(category: str, key: str, data: SetValueSchema, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return settings_service.set_setting(db, category, key, data.value)


@router.delete("/{category}/{key}")
def delete_setting(category: str, key: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    settings_service.delete_setting(db, category, key)
    return {"message": f"Setting {category}.{key} reset to default"}
