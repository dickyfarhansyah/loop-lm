from __future__ import annotations
import json
from datetime import datetime
from sqlalchemy.orm import Session
from src.db.models import User, Auth
from src.utils.errors import NotFoundError, ConflictError


class UserService:
    def _serialize(self, user: User) -> dict:
        return {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "name": user.name,
            "role": user.role,
            "profileImageUrl": user.profile_image_url,
            "profileBannerImageUrl": user.profile_banner_image_url,
            "bio": user.bio,
            "settings": json.loads(user.settings) if user.settings else None,
            "isMaster": user.is_master,
            "lastActiveAt": user.last_active_at.isoformat() if user.last_active_at else None,
            "createdAt": user.created_at.isoformat() if user.created_at else None,
            "updatedAt": user.updated_at.isoformat() if user.updated_at else None,
        }

    def get_users(self, db: Session) -> list:
        users = db.query(User).all()
        return [self._serialize(u) for u in users]

    def get_user_by_id(self, db: Session, user_id: str) -> dict:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundError("User not found")
        return self._serialize(user)

    def update_user(self, db: Session, user_id: str, data: dict) -> dict:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundError("User not found")

        allowed = ["name", "profile_image_url", "bio", "settings", "username"]
        for key, val in data.items():
            snake = _to_snake(key)
            if snake in allowed:
                if snake == "settings" and isinstance(val, dict):
                    val = json.dumps(val)
                setattr(user, snake, val)

        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
        return self._serialize(user)

    def delete_user(self, db: Session, user_id: str) -> None:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundError("User not found")
        db.delete(user)
        db.commit()

    def get_user_api_key(self, db: Session, user_id: str) -> str | None:
        from src.db.models import ApiKey
        key = db.query(ApiKey).filter(ApiKey.user_id == user_id).first()
        return key.key if key else None

    def generate_user_api_key(self, db: Session, user_id: str) -> str:
        from src.services.auth_service import auth_service
        return auth_service.generate_api_key(db, user_id)

    def delete_user_api_key(self, db: Session, user_id: str) -> None:
        from src.services.auth_service import auth_service
        auth_service.delete_api_key(db, user_id)


def _to_snake(name: str) -> str:
    import re
    s1 = re.sub("(.)([A-Z][a-z]+)", r"\1_\2", name)
    return re.sub("([a-z0-9])([A-Z])", r"\1_\2", s1).lower()


user_service = UserService()
