import json
from datetime import datetime
from nanoid import generate
from sqlalchemy.orm import Session
from src.db.models import Connection
from src.utils.errors import NotFoundError
import httpx


def _serialize(conn: Connection, hide_auth: bool = False) -> dict:
    return {
        "id": conn.id,
        "userId": conn.user_id,
        "name": conn.name,
        "type": conn.type,
        "providerType": conn.provider_type,
        "url": conn.url,
        "authType": conn.auth_type,
        "authValue": "********" if hide_auth and conn.auth_value else conn.auth_value,
        "headers": json.loads(conn.headers) if isinstance(conn.headers, str) and conn.headers else None,
        "prefixId": conn.prefix_id,
        "modelIds": json.loads(conn.model_ids) if isinstance(conn.model_ids, str) and conn.model_ids else [],
        "tags": json.loads(conn.tags) if isinstance(conn.tags, str) and conn.tags else [],
        "isEnabled": conn.is_enabled,
        "isDefault": conn.is_default,
        "priority": conn.priority,
        "lastVerifiedAt": conn.last_verified_at.isoformat() if conn.last_verified_at else None,
        "createdAt": conn.created_at.isoformat() if conn.created_at else None,
        "updatedAt": conn.updated_at.isoformat() if conn.updated_at else None,
    }


class ConnectionService:
    def create_connection(self, db: Session, user_id: str, data: dict) -> dict:
        now = datetime.utcnow()
        conn = Connection(
            id=generate(), user_id=user_id,
            name=data["name"],
            type=data.get("type", "external"),
            provider_type=data["providerType"],
            url=data["url"],
            auth_type=data.get("authType", "bearer"),
            auth_value=data.get("authValue"),
            headers=json.dumps(data["headers"]) if data.get("headers") else None,
            prefix_id=data.get("prefixId"),
            model_ids=json.dumps(data.get("modelIds", [])),
            tags=json.dumps(data.get("tags", [])),
            is_enabled=True,
            is_default=data.get("isDefault", False),
            priority=data.get("priority", 0),
            created_at=now, updated_at=now,
        )
        db.add(conn)
        db.commit()
        db.refresh(conn)
        return _serialize(conn, hide_auth=True)

    def get_connections(self, db: Session, user_id: str) -> list:
        conns = db.query(Connection).filter(Connection.user_id == user_id).all()
        return [_serialize(c, hide_auth=True) for c in conns]

    def get_connection_by_id(self, db: Session, conn_id: str, user_id: str) -> dict:
        conn = db.query(Connection).filter(Connection.id == conn_id, Connection.user_id == user_id).first()
        if not conn:
            raise NotFoundError("Connection not found")
        return _serialize(conn, hide_auth=True)

    def get_connection_raw(self, db: Session, conn_id: str, user_id: str) -> Connection:
        conn = db.query(Connection).filter(Connection.id == conn_id, Connection.user_id == user_id).first()
        if not conn:
            raise NotFoundError("Connection not found")
        return conn

    def update_connection(self, db: Session, conn_id: str, user_id: str, data: dict) -> dict:
        conn = db.query(Connection).filter(Connection.id == conn_id, Connection.user_id == user_id).first()
        if not conn:
            raise NotFoundError("Connection not found")
        field_map = {
            "name": "name", "type": "type", "providerType": "provider_type",
            "url": "url", "authType": "auth_type", "authValue": "auth_value",
            "prefixId": "prefix_id", "isEnabled": "is_enabled",
            "isDefault": "is_default", "priority": "priority",
        }
        for key, attr in field_map.items():
            if key in data:
                setattr(conn, attr, data[key])
        if "headers" in data:
            conn.headers = json.dumps(data["headers"]) if data["headers"] else None
        if "modelIds" in data:
            conn.model_ids = json.dumps(data["modelIds"])
        if "tags" in data:
            conn.tags = json.dumps(data["tags"])
        conn.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(conn)
        return _serialize(conn, hide_auth=True)

    def delete_connection(self, db: Session, conn_id: str, user_id: str) -> None:
        conn = db.query(Connection).filter(Connection.id == conn_id, Connection.user_id == user_id).first()
        if not conn:
            raise NotFoundError("Connection not found")
        db.delete(conn)
        db.commit()

    def verify_connection(self, db: Session, conn_id: str, user_id: str) -> dict:
        conn = db.query(Connection).filter(Connection.id == conn_id, Connection.user_id == user_id).first()
        if not conn:
            raise NotFoundError("Connection not found")
        try:
            headers = {"Content-Type": "application/json"}
            if conn.auth_type == "bearer" and conn.auth_value:
                headers["Authorization"] = f"Bearer {conn.auth_value}"
            elif conn.auth_type == "api_key" and conn.auth_value:
                headers["Authorization"] = f"Bearer {conn.auth_value}"
            resp = httpx.get(f"{conn.url.rstrip('/')}/v1/models", headers=headers, timeout=5)
            ok = resp.status_code < 400
            conn.last_verified_at = datetime.utcnow()
            db.commit()
            return {"success": ok, "status": resp.status_code}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_models_from_connection(self, db: Session, conn_id: str, user_id: str) -> list:
        conn = db.query(Connection).filter(Connection.id == conn_id, Connection.user_id == user_id).first()
        if not conn:
            raise NotFoundError("Connection not found")
        try:
            headers = {}
            if conn.auth_type in ("bearer", "api_key") and conn.auth_value:
                headers["Authorization"] = f"Bearer {conn.auth_value}"
            resp = httpx.get(f"{conn.url.rstrip('/')}/v1/models", headers=headers, timeout=5)
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", [])
        except Exception:
            return []

    def get_all_models_from_connections(self, db: Session, user_id: str) -> list:
        conns = db.query(Connection).filter(
            Connection.user_id == user_id, Connection.is_enabled == True
        ).all()
        models = []
        for conn in conns:
            try:
                headers = {}
                if conn.auth_type in ("bearer", "api_key") and conn.auth_value:
                    headers["Authorization"] = f"Bearer {conn.auth_value}"
                resp = httpx.get(f"{conn.url.rstrip('/')}/v1/models", headers=headers, timeout=5)
                resp.raise_for_status()
                data = resp.json()
                for m in data.get("data", []):
                    prefix = conn.prefix_id or ""
                    model_id = f"{prefix}{m.get('id', '')}" if prefix else m.get("id", "")
                    models.append({**m, "id": model_id, "connectionId": conn.id})
            except Exception:
                continue
        return models

    def has_connections(self, db: Session, user_id: str) -> bool:
        return db.query(Connection).filter(
            Connection.user_id == user_id, Connection.is_enabled == True
        ).count() > 0


connection_service = ConnectionService()
