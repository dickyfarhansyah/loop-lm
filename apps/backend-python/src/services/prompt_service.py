import json
from datetime import datetime
from nanoid import generate
from sqlalchemy.orm import Session
from src.db.models import Prompt
from src.utils.errors import NotFoundError


def _serialize(prompt: Prompt) -> dict:
    return {
        "id": prompt.id,
        "userId": prompt.user_id,
        "command": prompt.command,
        "title": prompt.title,
        "content": prompt.content,
        "createdAt": prompt.created_at.isoformat() if prompt.created_at else None,
        "updatedAt": prompt.updated_at.isoformat() if prompt.updated_at else None,
    }


class PromptService:
    def create_prompt(self, db: Session, user_id: str, command: str, title: str, content: str) -> dict:
        now = datetime.utcnow()
        prompt = Prompt(
            id=generate(), user_id=user_id,
            command=command, title=title, content=content,
            created_at=now, updated_at=now,
        )
        db.add(prompt)
        db.commit()
        db.refresh(prompt)
        return _serialize(prompt)

    def get_prompts(self, db: Session, user_id: str) -> list:
        prompts = db.query(Prompt).filter(Prompt.user_id == user_id).all()
        return [_serialize(p) for p in prompts]

    def get_prompt_by_id(self, db: Session, prompt_id: str, user_id: str) -> dict:
        prompt = db.query(Prompt).filter(Prompt.id == prompt_id, Prompt.user_id == user_id).first()
        if not prompt:
            raise NotFoundError("Prompt not found")
        return _serialize(prompt)

    def get_prompt_by_command(self, db: Session, command: str, user_id: str) -> dict:
        prompt = db.query(Prompt).filter(Prompt.command == command, Prompt.user_id == user_id).first()
        if not prompt:
            raise NotFoundError("Prompt not found")
        return _serialize(prompt)

    def update_prompt(self, db: Session, prompt_id: str, user_id: str, data: dict) -> dict:
        prompt = db.query(Prompt).filter(Prompt.id == prompt_id, Prompt.user_id == user_id).first()
        if not prompt:
            raise NotFoundError("Prompt not found")
        for key in ["command", "title", "content"]:
            if key in data:
                setattr(prompt, key, data[key])
        prompt.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(prompt)
        return _serialize(prompt)

    def delete_prompt(self, db: Session, prompt_id: str, user_id: str) -> None:
        prompt = db.query(Prompt).filter(Prompt.id == prompt_id, Prompt.user_id == user_id).first()
        if not prompt:
            raise NotFoundError("Prompt not found")
        db.delete(prompt)
        db.commit()


prompt_service = PromptService()
