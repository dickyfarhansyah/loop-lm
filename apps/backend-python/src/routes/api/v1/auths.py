from fastapi import APIRouter, Depends, Response, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.middleware.auth import get_current_user
from src.services.auth_service import auth_service
from src.db.models import User
from src.utils.jwt import parse_expiry
from src.config.env import env
from src.utils.errors import UnauthorizedError

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

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    access_token_max_age = parse_expiry(env.JWT_EXPIRES_IN)
    secure = env.NODE_ENV == "production"
    
    response.set_cookie(
        "access_token", access_token, httponly=True, samesite="lax",
        secure=secure,
        path="/", max_age=access_token_max_age,
    )
    
    response.set_cookie(
        "refresh_token", refresh_token, httponly=True, samesite="lax",
        secure=secure,
        path="/api/v1/auths", # Using base prefix instead of /refresh because /signout also needs to read and delete it.
        max_age=7 * 24 * 60 * 60,
    )

@router.post("/signup")
def signup(data: SignupSchema, response: Response, db: Session = Depends(get_db)):
    result = auth_service.signup(db, data.email, data.password, data.name)
    
    set_auth_cookies(response, result["access_token"], result["refresh_token"])
    
    return {**_user_response(result["user"]), "access_token": result["access_token"]}


@router.post("/signin")
def signin(data: SigninSchema, response: Response, db: Session = Depends(get_db)):
    result = auth_service.signin(db, data.email, data.password)
    
    set_auth_cookies(response, result["access_token"], result["refresh_token"])
    
    return {**_user_response(result["user"]), "access_token": result["access_token"]}


@router.post("/signout")
def signout(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    
    auth_service.signout(db, refresh_token)

    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/refresh") 
    
    return {"message": "Signed out successfully"}

@router.post("/refresh")
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise UnauthorizedError("No refresh token provided")
        
    result = auth_service.refresh_session(db, refresh_token)
    
    set_auth_cookies(response, result["access_token"], result["refresh_token"])
    return {"message": "Session refreshed successfully"}

@router.get("/session")
def session(current_user: User = Depends(get_current_user)):
    return _user_response(current_user)
