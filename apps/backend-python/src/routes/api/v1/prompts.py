from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.middleware.auth import get_current_user
from src.services.prompt_service import prompt_service
from src.db.models import User

router = APIRouter()


class CreatePromptSchema(BaseModel):
    command: str
    title: str
    content: str


class UpdatePromptSchema(BaseModel):
    command: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None


@router.post("")
def create_prompt(data: CreatePromptSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return prompt_service.create_prompt(db, user.id, data.command, data.title, data.content)


@router.get("")
def list_prompts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return prompt_service.get_prompts(db, user.id)


@router.get("/command/{command}")
def get_prompt_by_command(command: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return prompt_service.get_prompt_by_command(db, command, user.id)


@router.get("/{prompt_id}")
def get_prompt(prompt_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return prompt_service.get_prompt_by_id(db, prompt_id, user.id)


@router.put("/{prompt_id}")
def update_prompt(prompt_id: str, data: UpdatePromptSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return prompt_service.update_prompt(db, prompt_id, user.id, data.model_dump(exclude_none=True))


@router.delete("/{prompt_id}")
def delete_prompt(prompt_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prompt_service.delete_prompt(db, prompt_id, user.id)
    return {"message": "Prompt deleted"}
