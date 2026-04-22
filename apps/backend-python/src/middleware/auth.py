from __future__ import annotations
from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.utils.jwt import verify_token
from src.utils.errors import UnauthorizedError, ForbiddenError
from src.db.models import User, ApiKey

security = HTTPBearer(auto_error=False)


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token: str | None = None

    # 1. Bearer header
    if credentials and credentials.scheme.lower() == "bearer":
        token = credentials.credentials

    # 2. Cookie fallback
    if not token:
        token = request.cookies.get("access_token")

    if not token:
        raise UnauthorizedError("No token provided")

    # API key
    if token.startswith("sk-"):
        api_key = db.query(ApiKey).filter(ApiKey.key == token).first()
        if not api_key:
            raise UnauthorizedError("Invalid API key")
        user = db.query(User).filter(User.id == api_key.user_id).first()
        if not user:
            raise UnauthorizedError("User not found")
        return user

    # JWT
    payload = verify_token(token)
    if not payload:
        raise UnauthorizedError("Invalid or expired token")

    user = db.query(User).filter(User.id == payload.get("id")).first()
    if not user:
        raise UnauthorizedError("User not found")
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise ForbiddenError("Admin access required")
    return current_user
