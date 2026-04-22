from __future__ import annotations
import secrets
from datetime import datetime, timedelta
from nanoid import generate
from sqlalchemy.orm import Session
from src.db.models import User, Auth, ApiKey, UserSession
from src.utils.hash import hash_password, verify_password
from src.utils.jwt import generate_refresh_token, sign_access_token
from src.utils.errors import BadRequestError, UnauthorizedError, InternalServerError
from sqlalchemy.exc import SQLAlchemyError


class AuthService:
    def _create_tokens_and_session(self, db: Session, user: User) -> dict:
        """Internal helper function to create tokens and store sessions"""
        access_token = sign_access_token({
            "id": user.id, "email": user.email,
            "name": user.name, "role": user.role,
        })
        
        refresh_token = generate_refresh_token()
        hashed_rt = hash_password(refresh_token) 
        
        session_id = generate()
        expires_at = datetime.utcnow() + timedelta(days=7) 
        
        db_session = UserSession(
            id=session_id,
            user_id=user.id,
            hashed_refresh_token=hashed_rt,
            expires_at=expires_at
        )
        db.add(db_session)
        # DB commit is omitted here because we will do it as a transaction with other tables
        # db.commit()
        
        return {
            "access_token": access_token, 
            "refresh_token": f"{session_id}::{refresh_token}"
        }

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

        try:
            db.add(user)
            db.add(auth)
            
            tokens = self._create_tokens_and_session(db, user) # There is a db.add() call here
            
            db.commit()
            db.refresh(user)
            
            return {"user": user, **tokens}
        except SQLAlchemyError:
            db.rollback() 
            raise InternalServerError("Failed to register user")

    def signin(self, db: Session, email: str, password: str) -> dict:
        auth_record = db.query(Auth).filter(Auth.email == email).first()
        if not auth_record or not auth_record.active:
            raise UnauthorizedError("Invalid credentials")

        if not verify_password(password, auth_record.password):
            raise UnauthorizedError("Invalid credentials")

        user = db.query(User).filter(User.id == auth_record.id).first()
        if not user:
            raise UnauthorizedError("User not found")

        try:
            # Delete all expired user session (for cleanup)
            db.query(UserSession).filter(
                UserSession.user_id == user.id,
                UserSession.expires_at < datetime.utcnow()
            ).delete()

            tokens = self._create_tokens_and_session(db, user)
            db.commit() 
            return {"user": user, **tokens}
        except SQLAlchemyError:
            db.rollback()
            raise InternalServerError("Failed to create login session")

    def refresh_session(self, db: Session, raw_refresh_token: str) -> dict:
        try:
            session_id, plain_token = raw_refresh_token.split("::")
        except ValueError:
            raise UnauthorizedError("Invalid token format")

        db_session = db.query(UserSession).filter(UserSession.id == session_id).first()
        
        if not db_session:
            raise UnauthorizedError("Session not found")
            
        if db_session.expires_at < datetime.utcnow():
            try:
                db.delete(db_session)
                db.commit()
            except SQLAlchemyError:
                db.rollback()
            raise UnauthorizedError("Session expired")

        if not verify_password(plain_token, db_session.hashed_refresh_token):
            raise UnauthorizedError("Invalid refresh token")

        user = db.query(User).filter(User.id == db_session.user_id).first()
        
        try:
            db.delete(db_session)
            
            tokens = self._create_tokens_and_session(db, user)
            
            db.commit()
            
            return {"user": user, **tokens}
        except SQLAlchemyError:
            db.rollback() 
            raise InternalServerError("Failed to refresh and rotate session")

    def signout(self, db: Session, raw_refresh_token: str | None) -> None:
        """Delete session from database on user logout"""
        if not raw_refresh_token:
            return 
            
        try:
            session_id, _ = raw_refresh_token.split("::")
            print("session id: ", session_id)
            db.query(UserSession).filter(UserSession.id == session_id).delete()
            db.commit()
        except Exception:
            db.rollback()
            print("FAIL")
            pass # 'Pass' because failure to delete shouldn't stop cookies deletion

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
