from __future__ import annotations
import json
from datetime import datetime
from nanoid import generate
from sqlalchemy.orm import Session
from src.db.models import Setting
from src.utils.errors import NotFoundError

DEFAULT_SETTINGS = {
    "general": {
        "version": "1.0.0",
        "webui_name": "Wiratek AI",
        "logo_url": "",
        "logo_icon_url": "",
    },
    "auth": {
        "default_user_role": "pending",
        "default_group": "",
        "enable_signup": False,
        "show_admin_details": True,
        "admin_email": "",
        "enable_api_keys": False,
        "jwt_expiry": "4w",
    },
    "features": {
        "enable_community_sharing": True,
        "enable_message_rating": True,
        "enable_folders": True,
        "folder_max_file_count": 0,
    },
    "ui": {
        "default_theme": "system",
        "default_locale": "en",
        "banners": [],
        "default_prompt_suggestions": [],
    },
    "tasks": {
        "local_task_model": "",
        "external_task_model": "",
        "title_generation": True,
        "follow_up_generation": True,
        "tags_generation": True,
    },
    "audio": {
        "stt_enabled": False,
        "tts_enabled": False,
    },
    "images": {
        "enabled": False,
        "engine": "automatic1111",
    },
}


def _type_for(val) -> str:
    if isinstance(val, bool):
        return "boolean"
    if isinstance(val, (int, float)):
        return "number"
    if isinstance(val, (dict, list)):
        return "json"
    return "string"


def _encode(val) -> str | None:
    if val is None:
        return None
    if isinstance(val, (dict, list)):
        return json.dumps(val)
    return str(val)


def _decode(raw: str | None, typ: str | None):
    if raw is None:
        return None
    if typ == "boolean":
        return raw.lower() in ("true", "1", "yes")
    if typ == "number":
        return float(raw) if "." in raw else int(raw)
    if typ == "json":
        try:
            return json.loads(raw)
        except Exception:
            return raw
    return raw


class SettingsService:
    def get_categories(self) -> list[str]:
        return list(DEFAULT_SETTINGS.keys())

    def get_all_settings(self, db: Session) -> dict:
        result = {}
        for category in DEFAULT_SETTINGS:
            result[category] = self.get_settings_by_category(db, category)
        return result

    def get_settings_by_category(self, db: Session, category: str) -> dict:
        rows = db.query(Setting).filter(Setting.category == category).all()
        defaults = DEFAULT_SETTINGS.get(category, {})
        merged = dict(defaults)
        for row in rows:
            merged[row.key] = _decode(row.value, row.type)
        return merged

    def get_setting(self, db: Session, category: str, key: str):
        row = db.query(Setting).filter(
            Setting.category == category, Setting.key == key
        ).first()
        if row:
            return _decode(row.value, row.type)
        return DEFAULT_SETTINGS.get(category, {}).get(key)

    def set_setting(self, db: Session, category: str, key: str, value) -> dict:
        now = datetime.utcnow()
        row = db.query(Setting).filter(
            Setting.category == category, Setting.key == key
        ).first()
        if row:
            row.value = _encode(value)
            row.type = _type_for(value)
            row.updated_at = now
        else:
            row = Setting(
                id=generate(), category=category, key=key,
                value=_encode(value), type=_type_for(value),
                created_at=now, updated_at=now,
            )
            db.add(row)
        db.commit()
        return {"category": category, "key": key, "value": value}

    def update_category_settings(self, db: Session, category: str, data: dict) -> dict:
        for key, value in data.items():
            self.set_setting(db, category, key, value)
        return self.get_settings_by_category(db, category)

    def reset_category(self, db: Session, category: str) -> None:
        db.query(Setting).filter(Setting.category == category).delete()
        db.commit()

    def delete_setting(self, db: Session, category: str, key: str) -> None:
        db.query(Setting).filter(
            Setting.category == category, Setting.key == key
        ).delete()
        db.commit()


settings_service = SettingsService()
