from fastapi import APIRouter

from app.api.routes import admin, auth, health, site

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(site.router, prefix="/site", tags=["site"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
