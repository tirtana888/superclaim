"""Seed a development tenant for SuperClaim API testing."""

import asyncio
import uuid

from sqlalchemy import select

from app.database import get_session_factory
from app.models.tenant import Tenant
from app.security import hash_api_key

DEV_TENANT_NAME = "Globalbeli"
DEV_API_KEY = "sc_globalbeli_dev_2026"


async def main() -> None:
    session_factory = get_session_factory()
    async with session_factory() as session:
        key_hash = hash_api_key(DEV_API_KEY)
        existing = await session.execute(
            select(Tenant).where(Tenant.api_key_hash == key_hash)
        )
        tenant = existing.scalar_one_or_none()
        if tenant is None:
            tenant = Tenant(
                id=uuid.uuid4(),
                name=DEV_TENANT_NAME,
                api_key_hash=key_hash,
                is_active=True,
            )
            session.add(tenant)
            await session.commit()
            await session.refresh(tenant)
            print("Created tenant.")
        else:
            print("Tenant already exists.")

        print(f"TENANT_ID={tenant.id}")
        print(f"API_KEY={DEV_API_KEY}")


if __name__ == "__main__":
    asyncio.run(main())
