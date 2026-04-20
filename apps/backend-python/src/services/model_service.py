import json
from datetime import datetime
from nanoid import generate
from sqlalchemy.orm import Session
from src.db.models import Model, ModelPrompt
from src.utils.errors import NotFoundError


def _serialize_model(m: Model) -> dict:
    return {
        "id": m.id,
        "userId": m.user_id,
        "baseModelId": m.base_model_id,
        "name": m.name,
        "meta": json.loads(m.meta) if isinstance(m.meta, str) and m.meta else None,
        "params": json.loads(m.params) if isinstance(m.params, str) and m.params else None,
        "isEnabled": m.is_enabled,
        "isDefault": m.is_default,
        "isPinned": m.is_pinned,
        "createdAt": m.created_at.isoformat() if m.created_at else None,
        "updatedAt": m.updated_at.isoformat() if m.updated_at else None,
    }


class ModelService:
    def create_model(self, db: Session, user_id: str, data: dict) -> dict:
        now = datetime.utcnow()
        m = Model(
            id=generate(), user_id=user_id,
            base_model_id=data.get("baseModelId"),
            name=data["name"],
            meta=json.dumps(data.get("meta")) if data.get("meta") else None,
            params=json.dumps(data.get("params")) if data.get("params") else None,
            is_enabled=data.get("isEnabled", True),
            created_at=now, updated_at=now,
        )
        db.add(m)
        db.commit()
        db.refresh(m)
        return _serialize_model(m)

    def get_models(self, db: Session, user_id: str) -> list:
        models = db.query(Model).filter(Model.user_id == user_id).all()
        return [_serialize_model(m) for m in models]

    def get_model_by_id(self, db: Session, model_id: str, user_id: str) -> dict:
        m = db.query(Model).filter(Model.id == model_id, Model.user_id == user_id).first()
        if not m:
            raise NotFoundError("Model not found")
        return _serialize_model(m)

    def update_model(self, db: Session, model_id: str, user_id: str, data: dict) -> dict:
        m = db.query(Model).filter(Model.id == model_id, Model.user_id == user_id).first()
        if not m:
            raise NotFoundError("Model not found")
        if "name" in data:
            m.name = data["name"]
        if "baseModelId" in data:
            m.base_model_id = data["baseModelId"]
        if "meta" in data:
            m.meta = json.dumps(data["meta"]) if data["meta"] else None
        if "params" in data:
            m.params = json.dumps(data["params"]) if data["params"] else None
        if "isEnabled" in data:
            m.is_enabled = data["isEnabled"]
        m.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(m)
        return _serialize_model(m)

    def delete_model(self, db: Session, model_id: str, user_id: str) -> None:
        m = db.query(Model).filter(Model.id == model_id, Model.user_id == user_id).first()
        if not m:
            raise NotFoundError("Model not found")
        db.delete(m)
        db.commit()

    def toggle_enabled(self, db: Session, model_id: str, user_id: str, is_enabled: bool) -> dict:
        m = self._get_or_create_by_base_model_id(db, model_id, user_id)
        m.is_enabled = is_enabled
        m.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(m)
        return _serialize_model(m)

    def _get_or_create_by_base_model_id(self, db: Session, base_model_id: str, user_id: str) -> Model:
        """Get existing Model record by base_model_id, or create a lightweight one."""
        m = db.query(Model).filter(
            Model.base_model_id == base_model_id, Model.user_id == user_id
        ).first()
        if m:
            return m
        now = datetime.utcnow()
        m = Model(
            id=generate(), user_id=user_id,
            base_model_id=base_model_id,
            name=base_model_id,
            is_enabled=True,
            is_default=False,
            is_pinned=False,
            created_at=now, updated_at=now,
        )
        db.add(m)
        db.commit()
        db.refresh(m)
        return m

    def set_default(self, db: Session, base_model_id: str, user_id: str) -> dict:
        """Set a model as default, clearing any previous default for this user."""
        # Clear existing default
        db.query(Model).filter(
            Model.user_id == user_id, Model.is_default == True
        ).update({"is_default": False})
        db.commit()
        m = self._get_or_create_by_base_model_id(db, base_model_id, user_id)
        m.is_default = True
        m.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(m)
        return _serialize_model(m)

    def toggle_pinned(self, db: Session, base_model_id: str, user_id: str) -> dict:
        """Toggle the pinned state of a model."""
        m = self._get_or_create_by_base_model_id(db, base_model_id, user_id)
        m.is_pinned = not m.is_pinned
        m.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(m)
        return _serialize_model(m)

    def get_models_metadata(self, db: Session, user_id: str) -> dict:
        """Return a dict of base_model_id -> {isEnabled, isDefault, isPinned}."""
        records = db.query(Model).filter(Model.user_id == user_id).all()
        return {
            m.base_model_id: {
                "isEnabled": m.is_enabled,
                "isDefault": m.is_default,
                "isPinned": m.is_pinned,
            }
            for m in records if m.base_model_id
        }

    def get_system_prompt(self, db: Session, model_id: str, user_id: str) -> dict:
        mp = db.query(ModelPrompt).filter(
            ModelPrompt.model_id == model_id, ModelPrompt.user_id == user_id
        ).first()
        return {"modelId": model_id, "content": mp.content if mp else "", "title": mp.title if mp else ""}

    def update_system_prompt(self, db: Session, model_id: str, user_id: str, data: dict) -> dict:
        mp = db.query(ModelPrompt).filter(
            ModelPrompt.model_id == model_id, ModelPrompt.user_id == user_id
        ).first()
        now = datetime.utcnow()
        if mp:
            mp.content = data.get("content", mp.content)
            mp.title = data.get("title", mp.title)
            mp.updated_at = now
        else:
            mp = ModelPrompt(
                id=generate(), user_id=user_id, model_id=model_id,
                content=data.get("content", ""),
                title=data.get("title", ""),
                created_at=now, updated_at=now,
            )
            db.add(mp)
        db.commit()
        return {"modelId": model_id, "content": mp.content, "title": mp.title}

    def get_model_config(self, db: Session, model_id: str, user_id: str) -> dict:
        m = db.query(Model).filter(Model.id == model_id, Model.user_id == user_id).first()
        if not m:
            raise NotFoundError("Model not found")
        return json.loads(m.params) if isinstance(m.params, str) and m.params else {}

    def update_model_config(self, db: Session, model_id: str, user_id: str, data: dict) -> dict:
        m = db.query(Model).filter(Model.id == model_id, Model.user_id == user_id).first()
        if not m:
            raise NotFoundError("Model not found")
        m.params = json.dumps(data)
        m.updated_at = datetime.utcnow()
        db.commit()
        return data


model_service = ModelService()
