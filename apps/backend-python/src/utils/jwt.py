from __future__ import annotations
from datetime import datetime, timedelta
from jose import jwt, JWTError
from src.config.env import env
import secrets

ALGORITHM = "HS256"


def parse_expiry(expiry_str: str) -> int:
    """Parse '7d', '4w', '1h' style strings into seconds."""
    unit = expiry_str[-1]
    value = int(expiry_str[:-1])
    multipliers = {"s": 1, "m": 60, "h": 3600, "d": 86400, "w": 604800}
    return value * multipliers.get(unit, 86400)

def sign_access_token(payload: dict) -> str:
    """Generate stateless JWT for Access Token (Short-lived)"""
    expires_delta = timedelta(seconds=parse_expiry(env.JWT_EXPIRES_IN))
    data = payload.copy()
    data["exp"] = datetime.utcnow() + expires_delta
    return jwt.encode(data, env.JWT_SECRET, algorithm=ALGORITHM)

def verify_token(token: str) -> dict | None:
    """Verify standard JWT Access Token"""
    try:
        payload = jwt.decode(token, env.JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def generate_refresh_token() -> str:
    """Generate stateful opaque string for Refresh Token (Long-lived)"""
    return secrets.token_urlsafe(64)