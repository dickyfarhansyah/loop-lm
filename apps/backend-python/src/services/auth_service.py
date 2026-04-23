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

AUTH_GRACE_PERIOD_SECONDS = 5

class AuthService:
    def _create_tokens_and_session(self, db: Session, user: User, existing_session: UserSession = None) -> dict:
        """Internal helper function to create tokens and store sessions"""
        access_token = sign_access_token({
            "id": user.id, "email": user.email,
            "name": user.name, "role": user.role,
        })
        
        refresh_token = generate_refresh_token()
        hashed_rt = hash_password(refresh_token) 
        
        expires_at = datetime.utcnow() + timedelta(days=7) 
        now = datetime.utcnow()
        
        if existing_session:
            session_id = existing_session.id
            existing_session.hashed_refresh_token = hashed_rt
            existing_session.expires_at = expires_at
            existing_session.updated_at = now
        else:
            session_id = generate()
            db_session = UserSession(
                id=session_id,
                user_id=user.id,
                hashed_refresh_token=hashed_rt,
                expires_at=expires_at,
                is_valid=True,
                created_at=now,
                updated_at=now
            )
            db.add(db_session)
            
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
            # Soft delete all expired user session
            db.query(UserSession).filter(
                UserSession.user_id == user.id,
                UserSession.expires_at < datetime.utcnow()
            ).update({"is_valid": False, "updated_at": datetime.utcnow()})

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

        db_session = (
                db.query(UserSession)
                .with_for_update() # Row-level locking to prevent race condition
                .filter(UserSession.id == session_id)
                .first()
            )
        
        if not db_session or not db_session.is_valid:
            raise UnauthorizedError("Session not found or revoked")
            
        now = datetime.utcnow()

        if db_session.expires_at < now:
            db_session.is_valid = False
            db_session.updated_at = now
            db.commit()
            raise UnauthorizedError("Session expired")

        if not verify_password(plain_token, db_session.hashed_refresh_token):
            raise UnauthorizedError("Invalid refresh token")
        
        # Grace period (5 seconds) to prevent token re-creation and DB updates
        if db_session.updated_at and (now - db_session.updated_at < timedelta(seconds=AUTH_GRACE_PERIOD_SECONDS)):
            return {"grace_period_active": True}

        user = db.query(User).filter(User.id == db_session.user_id).first()
        
        try:
            # Create or update refresh token in DB
            tokens = self._create_tokens_and_session(db, user, existing_session=db_session)
            db.commit()
            return {"user": user, **tokens}
        except SQLAlchemyError:
            db.rollback() 
            raise InternalServerError("Failed to refresh and rotate session")

    def signout(self, db: Session, raw_refresh_token: str | None) -> None:
        if not raw_refresh_token:
            return 
            
        try:
            session_id, _ = raw_refresh_token.split("::")
            # Soft delete current session
            db.query(UserSession).filter(UserSession.id == session_id).update({
                "is_valid": False,
                "updated_at": datetime.utcnow()
            })
            db.commit()
        except Exception:
            db.rollback()
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
