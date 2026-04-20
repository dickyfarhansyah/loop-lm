from fastapi import APIRouter, Depends, Response, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.middleware.auth import get_current_user
from src.services.auth_service import auth_service
from src.db.models import User

router = APIRouter()


class SignupSchema(BaseModel):
    email: EmailStr
    password: str
    name: str


class SigninSchema(BaseModel):
    email: EmailStr
    password: str


def _user_response(u: User) -> dict:
    return {
        "id": u.id, "email": u.email, "name": u.name,
        "role": u.role, "profileImageUrl": u.profile_image_url,
    }


@router.post("/signup")
def signup(data: SignupSchema, response: Response, db: Session = Depends(get_db)):
    result = auth_service.signup(db, data.email, data.password, data.name)
    token = result["token"]
    response.set_cookie(
        "token", token, httponly=True, samesite="lax",
        max_age=60 * 60 * 24 * 7,
    )
    return {**_user_response(result["user"]), "token": token}


@router.post("/signin")
def signin(data: SigninSchema, response: Response, db: Session = Depends(get_db)):
    result = auth_service.signin(db, data.email, data.password)
    token = result["token"]
    response.set_cookie(
        "token", token, httponly=True, samesite="lax",
        max_age=60 * 60 * 24 * 7,
    )
    return {**_user_response(result["user"]), "token": token}


@router.post("/signout")
def signout(response: Response):
    response.delete_cookie("token")
    return {"message": "Signed out successfully"}


@router.get("/session")
def session(current_user: User = Depends(get_current_user)):
    return _user_response(current_user)
