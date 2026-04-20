"""
Proxy service: forwards requests to the AI provider (OpenAI-compatible).
Matches TypeScript backend behaviour:
  - Resolves connection by model ID
  - Injects system prompt from promptId / default model prompt / model config
  - Strips unknown fields (promptId) before forwarding
"""
import httpx
from sqlalchemy.orm import Session
from src.db.models import Connection, Model, ModelPrompt, User
from src.utils.errors import BadRequestError

_DEFAULT_TIMEOUT = 120.0


# ---------------------------------------------------------------------------
# Connection helpers
# ---------------------------------------------------------------------------

def _get_default_connection(db: Session, user_id: str) -> Connection:
    """Return the default/highest-priority enabled connection for user."""
    conn = (
        db.query(Connection)
        .filter(Connection.user_id == user_id, Connection.is_enabled == True)
        .order_by(Connection.is_default.desc(), Connection.priority.desc())
        .first()
    )
    if conn:
        return conn

    # Fallback: master user's connection
    master = db.query(User).filter(User.is_master == True).first()
    if master:
        conn = (
            db.query(Connection)
            .filter(Connection.user_id == master.id, Connection.is_enabled == True)
            .order_by(Connection.is_default.desc(), Connection.priority.desc())
            .first()
        )
        if conn:
            return conn

    raise BadRequestError("No AI provider connection configured")


def _get_connection_by_model(db: Session, user_id: str, model_id: str) -> Connection:
    """Return the most appropriate connection for a given model ID."""
    connections = (
        db.query(Connection)
        .filter(Connection.user_id == user_id, Connection.is_enabled == True)
        .order_by(Connection.priority.desc())
        .all()
    )

    if not connections:
        master = db.query(User).filter(User.is_master == True).first()
        if master:
            connections = (
                db.query(Connection)
                .filter(Connection.user_id == master.id, Connection.is_enabled == True)
                .order_by(Connection.priority.desc())
                .all()
            )

    for conn in connections:
        if conn.prefix_id and model_id.startswith(conn.prefix_id):
            return conn

    return _get_default_connection(db, user_id)


def _build_headers(conn: Connection) -> dict:
    headers = {"Content-Type": "application/json"}
    if conn.auth_type in ("bearer", "api_key") and conn.auth_value:
        headers["Authorization"] = f"Bearer {conn.auth_value}"
    return headers


def _chat_url(conn: Connection) -> str:
    return f"{conn.url.rstrip('/')}/v1/chat/completions"


# ---------------------------------------------------------------------------
# System prompt injection (mirrors TypeScript proxyService)
# ---------------------------------------------------------------------------

def _get_or_create_model(db: Session, model_id: str, user_id: str) -> Model:
    """Find existing model by base_model_id or create a lightweight record."""
    from datetime import datetime
    from nanoid import generate

    m = db.query(Model).filter(
        Model.base_model_id == model_id, Model.user_id == user_id
    ).first()
    if m:
        return m

    # Create placeholder
    m = Model(
        id=generate(),
        user_id=user_id,
        base_model_id=model_id,
        name=model_id,
        is_enabled=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


def _inject_system_prompt(db: Session, user_id: str, body: dict) -> dict:
    """
    1. Strip `promptId` from body.
    2. Resolve system prompt text (promptId → default model prompt → model config).
    3. Inject as first system message.
    Returns a clean copy of body ready to forward.
    """
    body = dict(body)  # shallow copy
    model_id = body.get("model", "")
    prompt_id = body.pop("promptId", None)  # always strip

    system_prompt_text = ""

    # 1. Explicit promptId
    if prompt_id:
        try:
            mp = db.query(ModelPrompt).filter(
                ModelPrompt.id == prompt_id, ModelPrompt.user_id == user_id
            ).first()
            if mp and mp.enabled:
                system_prompt_text = mp.prompt or mp.content or ""
                print(f"[PROXY] ✓ Using selected prompt: {mp.name}")
            else:
                print("[PROXY] ✗ promptId not found or disabled")
        except Exception as e:
            print(f"[PROXY] ✗ Error fetching promptId: {e}")

    # 2. Default model prompt
    if not system_prompt_text and model_id:
        try:
            model_record = _get_or_create_model(db, model_id, user_id)
            default_mp = db.query(ModelPrompt).filter(
                ModelPrompt.model_id == model_record.id,
                ModelPrompt.user_id == user_id,
                ModelPrompt.is_default == True,
                ModelPrompt.enabled == True,
            ).first()
            if default_mp:
                system_prompt_text = default_mp.prompt or default_mp.content or ""
                print(f"[PROXY] ✓ Using default model prompt: {default_mp.name}")
            else:
                print("[PROXY] ✗ No default model prompt")
        except Exception as e:
            print(f"[PROXY] ✗ Error fetching default prompt: {e}")

    # 3. Model config system prompt (legacy)
    if not system_prompt_text and model_id:
        try:
            model_record = _get_or_create_model(db, model_id, user_id)
            legacy_mp = db.query(ModelPrompt).filter(
                ModelPrompt.model_id == model_record.id,
                ModelPrompt.user_id == user_id,
            ).first()
            if legacy_mp:
                text = legacy_mp.prompt or legacy_mp.content or ""
                if text:
                    system_prompt_text = text
                    print("[PROXY] ✓ Using legacy model config prompt")
        except Exception as e:
            print(f"[PROXY] ✗ Error fetching legacy prompt: {e}")

    # Inject
    if system_prompt_text:
        messages = list(body.get("messages", []))
        if messages and messages[0].get("role") == "system":
            messages[0] = {"role": "system", "content": system_prompt_text}
            print("[PROXY] ✓ Replaced existing system message")
        else:
            messages.insert(0, {"role": "system", "content": system_prompt_text})
            print("[PROXY] ✓ Prepended new system message")
        body["messages"] = messages
    else:
        print("[PROXY] ✗ No system prompt to inject")

    return body


# ---------------------------------------------------------------------------
# Service class
# ---------------------------------------------------------------------------

class ProxyService:
    def get_models(self, db: Session, user_id: str) -> dict:
        conn = _get_default_connection(db, user_id)
        resp = httpx.get(
            f"{conn.url.rstrip('/')}/v1/models",
            headers=_build_headers(conn),
            timeout=_DEFAULT_TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()

    def chat_completions(self, db: Session, user_id: str, body: dict) -> dict:
        clean_body = _inject_system_prompt(db, user_id, body)
        model_id = clean_body.get("model", "")
        conn = _get_connection_by_model(db, user_id, model_id) if model_id else _get_default_connection(db, user_id)
        resp = httpx.post(
            _chat_url(conn),
            json=clean_body,
            headers=_build_headers(conn),
            timeout=_DEFAULT_TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()

    def completions(self, db: Session, user_id: str, body: dict) -> dict:
        conn = _get_default_connection(db, user_id)
        resp = httpx.post(
            f"{conn.url.rstrip('/')}/v1/completions",
            json=body,
            headers=_build_headers(conn),
            timeout=_DEFAULT_TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()

    def embeddings(self, db: Session, user_id: str, body: dict) -> dict:
        conn = _get_default_connection(db, user_id)
        resp = httpx.post(
            f"{conn.url.rstrip('/')}/v1/embeddings",
            json=body,
            headers=_build_headers(conn),
            timeout=_DEFAULT_TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()


proxy_service = ProxyService()
