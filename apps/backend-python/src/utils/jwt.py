from __future__ import annotations
from datetime import datetime, timedelta
from jose import jwt, JWTError
from src.config.env import env

ALGORITHM = "HS256"


def _parse_expiry(expiry_str: str) -> int:
    """Parse '7d', '4w', '1h' style strings into seconds."""
    unit = expiry_str[-1]
    value = int(expiry_str[:-1])
    multipliers = {"s": 1, "m": 60, "h": 3600, "d": 86400, "w": 604800}
    return value * multipliers.get(unit, 86400)


def sign_token(payload: dict) -> str:
    expires_delta = timedelta(seconds=_parse_expiry(env.JWT_EXPIRES_IN))
    data = payload.copy()
    data["exp"] = datetime.utcnow() + expires_delta
    return jwt.encode(data, env.JWT_SECRET, algorithm=ALGORITHM)


def verify_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, env.JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
