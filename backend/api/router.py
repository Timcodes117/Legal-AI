from fastapi import APIRouter

from backend.api.routes import guide, health, voice

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(guide.router, tags=["guide"])
api_router.include_router(voice.router, tags=["voice"])
