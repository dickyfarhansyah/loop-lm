from datetime import datetime
from nanoid import generate
from sqlalchemy.orm import Session
from src.db.models import ModelPrompt
from src.utils.errors import NotFoundError


def _serialize(mp: ModelPrompt) -> dict:
    prompt_text = mp.prompt or mp.content or ""
    name_text = mp.name or mp.title or ""
    return {
        "id": mp.id,
        "userId": mp.user_id,
        "modelId": mp.model_id,
        "name": name_text,
        "prompt": prompt_text,
        "enabled": bool(mp.enabled) if mp.enabled is not None else True,
        "isDefault": bool(mp.is_default) if mp.is_default is not None else False,
        "createdAt": mp.created_at.isoformat() if mp.created_at else None,
        "updatedAt": mp.updated_at.isoformat() if mp.updated_at else None,
    }


class ModelPromptService:
    def create(self, db: Session, user_id: str, model_id: str, data: dict) -> dict:
        now = datetime.utcnow()
        mp = ModelPrompt(
            id=generate(),
            user_id=user_id,
            model_id=model_id,
            name=data.get("name", ""),
            title=data.get("name", ""),
            prompt=data.get("prompt", ""),
            content=data.get("prompt", ""),
            enabled=data.get("enabled", True),
            is_default=data.get("isDefault", False),
            created_at=now,
            updated_at=now,
        )
        db.add(mp)
        db.commit()
        db.refresh(mp)
        return _serialize(mp)

    def get_all(self, db: Session, user_id: str) -> list:
        mps = db.query(ModelPrompt).filter(ModelPrompt.user_id == user_id).all()
        return [_serialize(m) for m in mps]

    def get_by_id(self, db: Session, mp_id: str, user_id: str) -> dict:
        mp = db.query(ModelPrompt).filter(ModelPrompt.id == mp_id, ModelPrompt.user_id == user_id).first()
        if not mp:
            raise NotFoundError("Model prompt not found")
        return _serialize(mp)

    def get_by_model(self, db: Session, model_id: str, user_id: str) -> list:
        mps = db.query(ModelPrompt).filter(
            ModelPrompt.model_id == model_id, ModelPrompt.user_id == user_id
        ).all()
        return [_serialize(m) for m in mps]

    def get_summary(self, db: Session, user_id: str) -> dict:
        mps = db.query(ModelPrompt).filter(ModelPrompt.user_id == user_id).all()
        summary = {}
        for mp in mps:
            if mp.model_id not in summary:
                summary[mp.model_id] = []
            summary[mp.model_id].append(_serialize(mp))
        return summary

    def set_default(self, db: Session, mp_id: str, user_id: str) -> dict:
        mp = db.query(ModelPrompt).filter(ModelPrompt.id == mp_id, ModelPrompt.user_id == user_id).first()
        if not mp:
            raise NotFoundError("Model prompt not found")
        # Unset all defaults for this model
        db.query(ModelPrompt).filter(
            ModelPrompt.model_id == mp.model_id, ModelPrompt.user_id == user_id
        ).update({"is_default": False})
        mp.is_default = True
        mp.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(mp)
        return _serialize(mp)

    def update(self, db: Session, mp_id: str, user_id: str, data: dict) -> dict:
        mp = db.query(ModelPrompt).filter(ModelPrompt.id == mp_id, ModelPrompt.user_id == user_id).first()
        if not mp:
            raise NotFoundError("Model prompt not found")
        if "name" in data:
            mp.name = data["name"]
            mp.title = data["name"]
        if "prompt" in data:
            mp.prompt = data["prompt"]
            mp.content = data["prompt"]
        if "enabled" in data:
            mp.enabled = data["enabled"]
        if "isDefault" in data:
            mp.is_default = data["isDefault"]
        mp.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(mp)
        return _serialize(mp)

    def delete(self, db: Session, mp_id: str, user_id: str) -> None:
        mp = db.query(ModelPrompt).filter(ModelPrompt.id == mp_id, ModelPrompt.user_id == user_id).first()
        if not mp:
            raise NotFoundError("Model prompt not found")
        db.delete(mp)
        db.commit()


model_prompt_service = ModelPromptService()
