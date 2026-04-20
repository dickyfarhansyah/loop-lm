from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.middleware.auth import get_current_user
from src.services.connection_service import connection_service
from src.db.models import User

router = APIRouter()


class CreateConnectionSchema(BaseModel):
    name: str
    providerType: str
    url: str
    type: Optional[str] = "external"
    authType: Optional[str] = "bearer"
    authValue: Optional[str] = None
    headers: Optional[dict] = None
    prefixId: Optional[str] = None
    modelIds: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    isDefault: Optional[bool] = False


class UpdateConnectionSchema(BaseModel):
    name: Optional[str] = None
    providerType: Optional[str] = None
    url: Optional[str] = None
    type: Optional[str] = None
    authType: Optional[str] = None
    authValue: Optional[str] = None
    headers: Optional[dict] = None
    prefixId: Optional[str] = None
    modelIds: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    isEnabled: Optional[bool] = None
    isDefault: Optional[bool] = None
    priority: Optional[int] = None


@router.post("")
def create_connection(data: CreateConnectionSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return connection_service.create_connection(db, user.id, data.model_dump())


@router.get("")
def list_connections(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return connection_service.get_connections(db, user.id)


@router.get("/status/check")
def check_connections(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    has = connection_service.has_connections(db, user.id)
    return {
        "configured": has,
        "message": "Connections configured" if has else "No connections configured",
    }


@router.get("/{conn_id}")
def get_connection(conn_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return connection_service.get_connection_by_id(db, conn_id, user.id)


@router.put("/{conn_id}")
def update_connection(conn_id: str, data: UpdateConnectionSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return connection_service.update_connection(db, conn_id, user.id, data.model_dump(exclude_none=True))


@router.delete("/{conn_id}")
def delete_connection(conn_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    connection_service.delete_connection(db, conn_id, user.id)
    return {"message": "Connection deleted"}


@router.post("/{conn_id}/verify")
def verify_connection(conn_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return connection_service.verify_connection(db, conn_id, user.id)


@router.get("/{conn_id}/models")
def get_models(conn_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    models = connection_service.get_models_from_connection(db, conn_id, user.id)
    return {"models": models}
