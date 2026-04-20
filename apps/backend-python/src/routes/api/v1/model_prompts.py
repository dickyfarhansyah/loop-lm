from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from urllib.parse import unquote
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.middleware.auth import get_current_user
from src.services.model_prompt_service import model_prompt_service
from src.db.models import User

router = APIRouter()


class CreateModelPromptSchema(BaseModel):
    name: str
    prompt: str
    enabled: Optional[bool] = True
    isDefault: Optional[bool] = False


class UpdateModelPromptSchema(BaseModel):
    name: Optional[str] = None
    prompt: Optional[str] = None
    enabled: Optional[bool] = None
    isDefault: Optional[bool] = None


# GET /model-prompts/summary
@router.get("/summary")
def get_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return model_prompt_service.get_summary(db, user.id)


# GET /model-prompts/models/{model_id}/prompts
@router.get("/models/{model_id}/prompts")
def get_by_model(model_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return model_prompt_service.get_by_model(db, unquote(model_id), user.id)


# POST /model-prompts/models/{model_id}/prompts
@router.post("/models/{model_id}/prompts")
def create(model_id: str, data: CreateModelPromptSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return model_prompt_service.create(db, user.id, unquote(model_id), data.model_dump())


# GET /model-prompts/prompts/{id}
@router.get("/prompts/{mp_id}")
def get_by_id(mp_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return model_prompt_service.get_by_id(db, mp_id, user.id)


# PUT /model-prompts/prompts/{id}
@router.put("/prompts/{mp_id}")
def update(mp_id: str, data: UpdateModelPromptSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return model_prompt_service.update(db, mp_id, user.id, data.model_dump(exclude_none=True))


# DELETE /model-prompts/prompts/{id}
@router.delete("/prompts/{mp_id}")
def delete(mp_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    model_prompt_service.delete(db, mp_id, user.id)
    return {"message": "Prompt deleted successfully"}


# POST /model-prompts/prompts/{id}/set-default
@router.post("/prompts/{mp_id}/set-default")
def set_default(mp_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return model_prompt_service.set_default(db, mp_id, user.id)
