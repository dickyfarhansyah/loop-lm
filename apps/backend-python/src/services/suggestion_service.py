"""
Suggestion service: generates follow-up questions after an AI response.
Mirrors the TypeScript SuggestionService behaviour.
"""
from __future__ import annotations
import logging
from sqlalchemy.orm import Session
from src.services.proxy_service import (
    _get_connection_by_model,
    _get_default_connection,
    _build_headers,
    _chat_url,
)
import httpx

logger = logging.getLogger(__name__)

_DEFAULT_TIMEOUT = 60.0


class SuggestionService:
    def generate_suggestions(
        self,
        db: Session,
        user_id: str,
        history: list[dict],
        current_content: str,
        preferred_model_id: str | None = None,
    ) -> list[str]:
        """
        Generate 3 follow-up questions based on conversation history and the
        latest assistant response.

        :param db: SQLAlchemy session
        :param user_id: ID of the requesting user
        :param history: List of message dicts with 'role' and 'content'
        :param current_content: The latest assistant response text
        :param preferred_model_id: Optional model to use for generation
        :return: List of up to 3 follow-up question strings
        """
        try:
            # Build message context (strip heavy fields like images)
            messages = [
                {"role": m["role"], "content": m.get("content") or ""}
                for m in history
            ]

            prompt = (
                f'Based on the conversation history and the last response below, '
                f'generate 3 short, relevant follow-up questions that the user might want to ask next.\n\n'
                f'Last Response:\n"{current_content}"\n\n'
                f'Return ONLY the 3 questions, separated by newlines. '
                f'Do not number them. Do not include any other text.'
            )

            # Use the same model the user used for their chat message
            model_id = preferred_model_id
            if not model_id:
                # Fallback: use the first model available from default connection
                try:
                    conn_fallback = _get_default_connection(db, user_id)
                    resp_models = httpx.get(
                        f"{conn_fallback.url.rstrip('/')}/v1/models",
                        headers=_build_headers(conn_fallback),
                        timeout=10.0,
                    )
                    resp_models.raise_for_status()
                    available = resp_models.json().get("data", [])
                    if available:
                        model_id = available[0]["id"]
                except Exception as e:
                    logger.warning("Failed to fetch fallback model for suggestions: %s", e)

            if not model_id:
                logger.warning("[SuggestionService] No model available, skipping suggestions")
                return []

            logger.info("[SuggestionService] Generating suggestions using model: %s", model_id)

            conn = (
                _get_connection_by_model(db, user_id, model_id)
                if model_id
                else _get_default_connection(db, user_id)
            )

            resp = httpx.post(
                _chat_url(conn),
                json={
                    "model": model_id,
                    "messages": [
                        *messages,
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.7,
                    "stream": False,
                },
                headers=_build_headers(conn),
                timeout=_DEFAULT_TIMEOUT,
            )
            resp.raise_for_status()

            content: str = (
                resp.json()
                .get("choices", [{}])[0]
                .get("message", {})
                .get("content", "")
            )

            logger.info("[SuggestionService] Generated content: %s", content)

            # Parse: split by newline, remove numbering/bullets, keep up to 3
            suggestions = [
                _clean_line(line)
                for line in content.split("\n")
                if line.strip()
            ]
            suggestions = [s for s in suggestions if s][:3]

            return suggestions

        except Exception as e:
            logger.error("Error generating suggestions: %s", e)
            return []


def _clean_line(line: str) -> str:
    """Remove leading numbering, dashes, or bullet characters."""
    import re
    line = line.strip()
    line = re.sub(r"^\d+[\.\)]\s*", "", line)  # "1. " or "1) "
    line = re.sub(r"^[-•*]\s*", "", line)       # "- " or "• "
    return line.strip()


suggestion_service = SuggestionService()
