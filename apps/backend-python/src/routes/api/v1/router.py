from fastapi import APIRouter
from src.routes.api.v1 import (
    setup, auths, users, chats, files, folders,
    prompts, models, model_prompts, tags, connections,
    settings, proxy, notes, knowledge, database, groups,
)

api_v1 = APIRouter()

# No auth required
api_v1.include_router(setup.router, prefix="/setup", tags=["setup"])

api_v1.include_router(auths.router, prefix="/auths", tags=["auth"])
api_v1.include_router(users.router, prefix="/users", tags=["users"])
api_v1.include_router(chats.router, prefix="/chats", tags=["chats"])
api_v1.include_router(files.router, prefix="/files", tags=["files"])
api_v1.include_router(folders.router, prefix="/folders", tags=["folders"])
api_v1.include_router(prompts.router, prefix="/prompts", tags=["prompts"])
api_v1.include_router(models.router, prefix="/models", tags=["models"])
api_v1.include_router(model_prompts.router, prefix="/model-prompts", tags=["model-prompts"])
api_v1.include_router(tags.router, prefix="/tags", tags=["tags"])
api_v1.include_router(connections.router, prefix="/connections", tags=["connections"])
api_v1.include_router(settings.router, prefix="/settings", tags=["settings"])
api_v1.include_router(proxy.router, prefix="/proxy", tags=["proxy"])
api_v1.include_router(notes.router, prefix="/notes", tags=["notes"])
api_v1.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"])
api_v1.include_router(database.router, prefix="/database", tags=["database"])
api_v1.include_router(groups.router, prefix="/groups", tags=["groups"])
