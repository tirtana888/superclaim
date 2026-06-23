from app.api.control.auth import router as auth_router
from app.api.control.devices import router as devices_router
from app.api.control.policies import router as policies_router

__all__ = ["auth_router", "devices_router", "policies_router"]
