from __future__ import annotations

import json
import os
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session

from src.config.database import get_db
from src.config.env import env
from src.middleware.auth import get_current_user
from src.db.models import User, Chat
from src.services.settings_service import settings_service

router = APIRouter()


def _require_admin(user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


# ---------------------------------------------------------------------------
# GET /database/download  — download raw SQLite file
# ---------------------------------------------------------------------------
@router.get("/download")
def download_database(user: User = Depends(_require_admin)):
    db_path = env.DATABASE_URL
    if not os.path.isabs(db_path):
        db_path = os.path.join(os.path.dirname(__file__), "../../../../", db_path)
    db_path = os.path.normpath(db_path)
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail="Database file not found")
    filename = f"wiratek-ai-db-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.db"
    return FileResponse(
        db_path,
        media_type="application/octet-stream",
        filename=filename,
    )


# ---------------------------------------------------------------------------
# GET /database/export/config  — export all settings as JSON
# ---------------------------------------------------------------------------
@router.get("/export/config")
def export_config(user: User = Depends(_require_admin), db: Session = Depends(get_db)):
    config = settings_service.get_all_settings(db)
    now = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    return JSONResponse(
        content={"exported_at": datetime.utcnow().isoformat(), "config": config},
        headers={"Content-Disposition": f'attachment; filename="wiratek-config-{now}.json"'},
    )


# ---------------------------------------------------------------------------
# POST /database/import/config  — import settings from JSON
# ---------------------------------------------------------------------------
@router.post("/import/config")
async def import_config(
    file: UploadFile = File(...),
    user: User = Depends(_require_admin),
    db: Session = Depends(get_db),
):
    try:
        content = await file.read()
        data = json.loads(content)
        config: dict = data.get("config", data)  # accept both wrapped and flat
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON file")

    updated = 0
    for category, values in config.items():
        if isinstance(values, dict):
            for key, value in values.items():
                settings_service.set_setting(db, category, key, value)
                updated += 1
    return {"message": f"Config imported successfully ({updated} keys)"}


# ---------------------------------------------------------------------------
# GET /database/export/chats  — export all chats (admin: all users)
# ---------------------------------------------------------------------------
@router.get("/export/chats")
def export_chats(user: User = Depends(_require_admin), db: Session = Depends(get_db)):
    chats = db.query(Chat).all()
    data = []
    for c in chats:
        try:
            messages = json.loads(c.chat) if c.chat else []
        except Exception:
            messages = []
        data.append({
            "id": c.id,
            "userId": c.user_id,
            "title": c.title,
            "pinned": c.pinned,
            "archived": c.archived,
            "messages": messages,
            "createdAt": c.created_at.isoformat() if c.created_at else None,
            "updatedAt": c.updated_at.isoformat() if c.updated_at else None,
        })
    now = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    return JSONResponse(
        content={"exported_at": datetime.utcnow().isoformat(), "chats": data},
        headers={"Content-Disposition": f'attachment; filename="wiratek-chats-{now}.json"'},
    )


# ---------------------------------------------------------------------------
# GET /database/export/users  — export user list
# ---------------------------------------------------------------------------
@router.get("/export/users")
def export_users(user: User = Depends(_require_admin), db: Session = Depends(get_db)):
    users = db.query(User).all()
    data = [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "createdAt": u.created_at.isoformat() if u.created_at else None,
            "updatedAt": u.updated_at.isoformat() if u.updated_at else None,
        }
        for u in users
    ]
    now = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    return JSONResponse(
        content={"exported_at": datetime.utcnow().isoformat(), "users": data},
        headers={"Content-Disposition": f'attachment; filename="wiratek-users-{now}.json"'},
    )
