from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.api.router import api_router
from backend.api.routes.pages import router as pages_router
from backend.core.config import DIST, cors_origins


def create_app() -> FastAPI:
    application = FastAPI(title="Court Rights Voice Guide")
    application.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins(),
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.include_router(pages_router)
    application.include_router(api_router, prefix="/api")
    if (DIST / "assets").exists():
        application.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")
    return application


app = create_app()
