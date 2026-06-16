from fastapi import APIRouter
from app.api.v1.endpoints import auth, projects, experiments, documents, journal_clubs, users

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(experiments.router, prefix="/experiments", tags=["Experiments"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(journal_clubs.router, prefix="/journal-clubs", tags=["Journal Clubs"])
