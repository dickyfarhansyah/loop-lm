from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.db.models import User, Auth
from src.utils.hash import hash_password
from src.utils.errors import BadRequestError
from src.services.settings_service import settings_service
from nanoid import generate
from datetime import datetime

router = APIRouter()


class SetupSchema(BaseModel):
    name: str
    email: EmailStr
    password: str
    app_name: str = ""
    logo_url: str = ""
    logo_icon_url: str = ""


@router.get("/status")
def setup_status(db: Session = Depends(get_db)):
    count = db.query(User).count()
    return {"setupRequired": count == 0, "userCount": count}


@router.post("")
def setup(data: SetupSchema, db: Session = Depends(get_db)):
    if db.query(User).count() > 0:
        raise BadRequestError("Setup already completed. Admin account exists.")

    now = datetime.utcnow()
    user_id = generate()
    hashed = hash_password(data.password)

    user = User(
        id=user_id, email=data.email, name=data.name,
        role="admin", is_master=True,
        profile_image_url="/user.png",
        last_active_at=now, created_at=now, updated_at=now,
    )
    auth = Auth(id=user_id, email=data.email, password=hashed, active=True)

    db.add(user)
    db.add(auth)
    db.commit()

    if data.app_name:
        settings_service.set_setting(db, "general", "webui_name", data.app_name)
    if data.logo_url:
        settings_service.set_setting(db, "general", "logo_url", data.logo_url)
    if data.logo_icon_url:
        settings_service.set_setting(db, "general", "logo_icon_url", data.logo_icon_url)

    return {"success": True, "message": "Master admin account created successfully"}
