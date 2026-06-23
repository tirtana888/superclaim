"""Bootstrap platform superadmin from environment variables."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.security import hash_password
from app.models.platform_admin import PlatformAdmin


async def ensure_superadmin(db: AsyncSession) -> None:
    """Create the first platform admin when SUPERADMIN_EMAIL/PASSWORD are set."""
    email = settings.superadmin_email.strip().lower()
    password = settings.superadmin_password
    if not email or not password:
        return

    count = (await db.execute(select(func.count(PlatformAdmin.id)))).scalar_one()
    if int(count) > 0:
        return

    existing = await db.execute(select(PlatformAdmin).where(PlatformAdmin.email == email))
    if existing.scalar_one_or_none() is not None:
        return

    db.add(
        PlatformAdmin(
            email=email,
            password_hash=hash_password(password),
            status="active",
        )
    )
    await db.commit()
