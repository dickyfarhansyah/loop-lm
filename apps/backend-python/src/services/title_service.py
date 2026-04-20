from __future__ import annotations
import logging
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """Generate a concise, descriptive title (3-6 words) for this conversation.
Start with a relevant emoji that represents the topic.
Only respond with the emoji and title, no quotes, no explanation, no punctuation at the end.
The title should capture the main topic or intent of the conversation.

Examples:
- User asks "What is TypeScript?" → "📘 Introduction to TypeScript"
- User says "Hi" → "👋 Initial Greeting Exchange"
- User asks "How to fix this bug in React?" → "🐛 React Bug Troubleshooting"
- User says "Help me write a poem" → "✨ Creative Poetry Writing"
- User asks about Python → "🐍 Python Programming Help"
- User asks about database → "🗄️ Database Query Assistance"
- User asks about API → "🔌 API Integration Guide"
- User asks about deployment → "🚀 Deployment Setup Guide\""""


class TitleService:
    def generate_title(self, db: Session, user_id: str, messages: list[dict], model: str | None = None) -> str:
        """
        Generate a short AI-powered title for a chat conversation.
        Calls /v1/chat/completions using the user's active connection.
        Falls back to truncating the first user message if AI fails.
        """
        from src.services.proxy_service import proxy_service

        context = messages[:4]

        title_messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            *[{"role": m.get("role", "user"), "content": str(m.get("content", ""))[:500]} for m in context],
            {"role": "user", "content": "Based on the conversation above, generate a short title."},
        ]

        try:
            # Use the model from the chat request
            use_model = model
            if not use_model:
                # Fallback: pick the first available model from the connection
                try:
                    models_resp = proxy_service.get_models(db, user_id)
                    model_list = models_resp.get("data", [])
                    use_model = model_list[0]["id"] if model_list else None
                    logger.info(f"[title] No model in request, using fallback: {use_model}")
                except Exception as e:
                    logger.warning(f"[title] Could not fetch models: {e}")

            if not use_model:
                raise ValueError("No model available")

            logger.info(f"[title] Calling AI with model={use_model} messages={len(title_messages)}")

            response = proxy_service.chat_completions(db, user_id, {
                "model": use_model,
                "messages": title_messages,
                "max_tokens": 500,
                "temperature": 0.7,
                "think": False,  # Disable thinking mode for Ollama thinking models
            })

            message_obj = (response.get("choices", [{}])[0]
                           .get("message", {}))
            finish_reason = (response.get("choices", [{}])[0].get("finish_reason", ""))
            logger.info(f"[title] Raw response: finish_reason={finish_reason} content={repr((message_obj.get('content') or '')[:80])} reasoning_len={len(message_obj.get('reasoning') or '')}")
            # Some reasoning/thinking models put output in 'reasoning' with empty 'content'
            content = (message_obj.get("content") or "").strip()
            if not content:
                reasoning = (message_obj.get("reasoning") or "").strip()
                # Extract the last meaningful line from reasoning (the actual title answer)
                if reasoning:
                    lines = [l.strip() for l in reasoning.splitlines() if l.strip()]
                    content = lines[-1] if lines else ""
                    logger.info(f"[title] Used reasoning fallback, extracted: {repr(content[:80])}")
            title = content

            # Clean up
            title = title.strip('"\'')
            title = title.rstrip(".")
            title = title[:50]

            return title or "New Chat"

        except Exception as e:
            logger.warning(f"[title] AI generation failed: {type(e).__name__}: {e}", exc_info=True)
            # Fallback: truncate first user message
            first_user = next((m for m in messages if m.get("role") == "user"), None)
            if first_user:
                content = str(first_user.get("content", ""))
                return content[:30] + ("..." if len(content) > 30 else "")
            return "New Chat"


title_service = TitleService()
