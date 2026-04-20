from __future__ import annotations
import secrets
from datetime import datetime
from nanoid import generate
from sqlalchemy.orm import Session
from src.db.models import User, Auth, ApiKey
from src.utils.hash import hash_password, verify_password
from src.utils.jwt import sign_token
from src.utils.errors import BadRequestError, UnauthorizedError


class AuthService:
    def signup(self, db: Session, email: str, password: str, name: str) -> dict:
        existing = db.query(Auth).filter(Auth.email == email).first()
        if existing:
            raise BadRequestError("Email already registered")

        hashed = hash_password(password)
        user_id = generate()
        now = datetime.utcnow()

        user_count = db.query(User).count()
        role = "admin" if user_count == 0 else "user"

        user = User(
            id=user_id, email=email, name=name, role=role,
            profile_image_url="/user.png",
            last_active_at=now, created_at=now, updated_at=now,
        )
        auth = Auth(id=user_id, email=email, password=hashed, active=True)

        db.add(user)
        db.add(auth)
        db.commit()
        db.refresh(user)

        token = sign_token({"id": user_id, "email": email, "name": name, "role": role})
        return {"user": user, "token": token}

    def signin(self, db: Session, email: str, password: str) -> dict:
        auth_record = db.query(Auth).filter(Auth.email == email).first()
        if not auth_record or not auth_record.active:
            raise UnauthorizedError("Invalid credentials")

        if not verify_password(password, auth_record.password):
            raise UnauthorizedError("Invalid credentials")

        user = db.query(User).filter(User.id == auth_record.id).first()
        if not user:
            raise UnauthorizedError("User not found")

        token = sign_token({
            "id": user.id, "email": user.email,
            "name": user.name, "role": user.role,
        })
        return {"user": user, "token": token}

    def generate_api_key(self, db: Session, user_id: str) -> str:
        key = f"sk-{secrets.token_urlsafe(36)}"
        now = datetime.utcnow()
        db.query(ApiKey).filter(ApiKey.user_id == user_id).delete()
        db.add(ApiKey(
            id=f"key_{user_id}", user_id=user_id, key=key,
            created_at=now, updated_at=now,
        ))
        db.commit()
        return key

    def delete_api_key(self, db: Session, user_id: str) -> None:
        db.query(ApiKey).filter(ApiKey.user_id == user_id).delete()
        db.commit()

    def get_user_by_api_key(self, db: Session, key: str) -> User | None:
        api_key = db.query(ApiKey).filter(ApiKey.key == key).first()
        if not api_key:
            return None
        return db.query(User).filter(User.id == api_key.user_id).first()


auth_service = AuthService()
