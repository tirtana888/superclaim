from app.api.control.auth import router as auth_router
from app.api.control.credentials import router as credentials_router
from app.api.control.devices import router as devices_router
from app.api.control.policies import router as policies_router
from app.api.control.team import router as team_router

__all__ = [
    "auth_router",
    "credentials_router",
    "devices_router",
    "policies_router",
    "team_router",
]
