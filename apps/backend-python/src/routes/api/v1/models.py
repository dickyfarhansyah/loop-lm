from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.middleware.auth import get_current_user
from src.services.model_service import model_service
from src.services.connection_service import connection_service
from src.db.models import User

router = APIRouter()


class CreateModelSchema(BaseModel):
    name: str
    baseModelId: Optional[str] = None
    meta: Optional[dict] = None
    params: Optional[dict] = None
    isEnabled: bool = True


class UpdateSystemPromptSchema(BaseModel):
    content: Optional[str] = None
    title: Optional[str] = None


class ToggleEnabledSchema(BaseModel):
    isEnabled: bool


@router.get("/available")
def get_available_models(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    models = connection_service.get_all_models_from_connections(db, user.id)
    metadata = model_service.get_models_metadata(db, user.id)
    # Merge DB metadata (isEnabled, isDefault, isPinned) into each model
    merged = []
    for m in models:
        meta = metadata.get(m["id"], {})
        merged.append({
            **m,
            "isEnabled": meta.get("isEnabled", True),
            "isDefault": meta.get("isDefault", False),
            "isPinned": meta.get("isPinned", False),
        })
    return {"object": "list", "data": merged}


@router.post("")
def create_model(data: CreateModelSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return model_service.create_model(db, user.id, data.model_dump())


@router.get("")
def list_models(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return model_service.get_models(db, user.id)


@router.get("/{model_id}")
def get_model(model_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return model_service.get_model_by_id(db, model_id, user.id)


@router.put("/{model_id}")
def update_model(model_id: str, data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return model_service.update_model(db, model_id, user.id, data)


@router.delete("/{model_id}")
def delete_model(model_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    model_service.delete_model(db, model_id, user.id)
    return {"message": "Model deleted"}


@router.put("/{model_id}/toggle-enabled")
def toggle_enabled(model_id: str, data: ToggleEnabledSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    import urllib.parse
    base_model_id = urllib.parse.unquote(model_id)
    return model_service.toggle_enabled(db, base_model_id, user.id, data.isEnabled)


@router.post("/{model_id}/set-default")
def set_default(model_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    import urllib.parse
    base_model_id = urllib.parse.unquote(model_id)
    return model_service.set_default(db, base_model_id, user.id)


@router.post("/{model_id}/toggle-pinned")
def toggle_pinned(model_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    import urllib.parse
    base_model_id = urllib.parse.unquote(model_id)
    return model_service.toggle_pinned(db, base_model_id, user.id)


@router.get("/{model_id}/system-prompt")
def get_system_prompt(model_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return model_service.get_system_prompt(db, model_id, user.id)


@router.put("/{model_id}/system-prompt")
def update_system_prompt(model_id: str, data: UpdateSystemPromptSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return model_service.update_system_prompt(db, model_id, user.id, data.model_dump(exclude_none=True))


@router.get("/{model_id}/config")
def get_model_config(model_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return model_service.get_model_config(db, model_id, user.id)


@router.put("/{model_id}/config")
def update_model_config(model_id: str, data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return model_service.update_model_config(db, model_id, user.id, data)
