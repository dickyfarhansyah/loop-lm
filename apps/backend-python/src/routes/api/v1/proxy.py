import json
import logging
import time
from datetime import datetime, timezone
import aiohttp
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.middleware.auth import get_current_user
from src.services.proxy_service import (
    proxy_service,
    _get_connection_by_model,
    _get_default_connection,
    _build_headers,
    _chat_url,
    _inject_system_prompt,
)
from src.db.models import User

log = logging.getLogger(__name__)

# Match Open WebUI's timeout: total=None means no timeout, connect=10s
_AIOHTTP_TIMEOUT = aiohttp.ClientTimeout(total=None, connect=10)

router = APIRouter()


def _ts() -> str:
    """Return current UTC time as a precise ISO string for log ordering."""
    return datetime.now(timezone.utc).strftime("%H:%M:%S.%f")[:-3]


@router.get("/models")
def list_models(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return proxy_service.get_models(db, user.id)


async def _cleanup(response, session):
    """Identical to Open WebUI's cleanup_response()."""
    if response:
        response.close()
    if session:
        await session.close()


async def _stream_wrapper(response, session, model_id: str, request_id: str):
    """
    Identical to Open WebUI's stream_wrapper().
    Iterates response.content which uses aiohttp.StreamReader.readany() internally —
    yields whatever bytes are currently in the socket buffer without any line buffering.
    This is the key difference vs httpx: readany() returns IMMEDIATELY with available data.
    """
    chunk_count = 0
    total_bytes = 0
    first_chunk = True
    t_start = time.perf_counter()

    try:
        async for chunk in response.content.iter_any():
            if chunk:
                now = _ts()
                elapsed = (time.perf_counter() - t_start) * 1000  # ms
                chunk_count += 1
                total_bytes += len(chunk)

                if first_chunk:
                    log.info(
                        "[stream][%s] ⚡ FIRST CHUNK  model=%-25s  +%.0fms  %d bytes",
                        now, model_id, elapsed, len(chunk)
                    )
                    first_chunk = False
                else:
                    log.debug(
                        "[stream][%s] → chunk #%-4d  model=%-25s  +%.0fms  %d bytes  total=%d B",
                        now, chunk_count, model_id, elapsed, len(chunk), total_bytes
                    )

                yield chunk
    finally:
        elapsed_total = (time.perf_counter() - t_start) * 1000
        log.info(
            "[stream][%s] ✅ DONE  model=%-25s  chunks=%d  total=%d B  duration=%.0fms  req=%s",
            _ts(), model_id, chunk_count, total_bytes, elapsed_total, request_id
        )
        await _cleanup(response, session)


@router.post("/chat/completions")
async def chat_completions(
    body: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.get("stream"):
        clean_body = _inject_system_prompt(db, user.id, body)
        model_id = clean_body.get("model", "")
        conn = _get_connection_by_model(db, user.id, model_id) if model_id else _get_default_connection(db, user.id)
        url = _chat_url(conn)
        headers = _build_headers(conn)

        request_id = f"{int(time.time() * 1000) % 100000:05d}"  # last 5 digits of ms epoch

        r = None
        session = None
        streaming = False

        log.info(
            "[stream][%s] 🚀 START  model=%-25s  user=%s  req=%s",
            _ts(), model_id, user.id[:8], request_id
        )
        t_request = time.perf_counter()

        try:
            session = aiohttp.ClientSession(trust_env=True, timeout=_AIOHTTP_TIMEOUT)
            r = await session.request(
                method="POST",
                url=url,
                json=clean_body,
                headers=headers,
            )

            conn_elapsed = (time.perf_counter() - t_request) * 1000
            log.info(
                "[stream][%s] 🔗 CONNECTED  model=%-25s  status=%d  +%.0fms  req=%s",
                _ts(), model_id, r.status, conn_elapsed, request_id
            )

            if r.status >= 400:
                try:
                    error_body = await r.json()
                except Exception:
                    error_body = {"error": await r.text()}
                log.warning(
                    "[stream][%s] ❌ ERROR  model=%s  status=%d  req=%s",
                    _ts(), model_id, r.status, request_id
                )
                await _cleanup(r, session)
                return JSONResponse(status_code=r.status, content=error_body)

            # Pass through Content-Type + disable all caching/buffering proxies
            streaming = True
            return StreamingResponse(
                _stream_wrapper(r, session, model_id, request_id),
                status_code=r.status,
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache, no-transform",
                    "X-Accel-Buffering": "no",
                    "Connection": "keep-alive",
                },
            )

        except Exception as exc:
            log.exception("[stream][%s] 💥 EXCEPTION  model=%s  req=%s  err=%s", _ts(), model_id, request_id, exc)
            if not streaming:
                await _cleanup(r, session)
            error_msg = json.dumps({"error": str(exc)})
            async def _err():
                yield f"data: {error_msg}\n\n".encode()
            return StreamingResponse(_err(), media_type="text/event-stream", status_code=500)

    return proxy_service.chat_completions(db, user.id, body)


@router.post("/completions")
def completions(body: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return proxy_service.completions(db, user.id, body)


@router.post("/embeddings")
def embeddings(body: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return proxy_service.embeddings(db, user.id, body)
