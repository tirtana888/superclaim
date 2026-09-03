"""Seed a development sales rep account for testing the Sales dashboard."""

import asyncio

from sqlalchemy import select

from app.core.security import hash_password
from app.database import get_session_factory
from app.models.sales_rep import SalesRep

DEV_SALES_REP_NAME = "Dev Sales"
DEV_SALES_REP_EMAIL = "sales@superclaim.dev"
DEV_SALES_REP_PASSWORD = "sales_dev_2026"


async def main() -> None:
    session_factory = get_session_factory()
    async with session_factory() as session:
        existing = await session.execute(
            select(SalesRep).where(SalesRep.email == DEV_SALES_REP_EMAIL)
        )
        sales_rep = existing.scalar_one_or_none()
        if sales_rep is None:
            sales_rep = SalesRep(
                name=DEV_SALES_REP_NAME,
                email=DEV_SALES_REP_EMAIL,
                password_hash=hash_password(DEV_SALES_REP_PASSWORD),
                status="active",
            )
            session.add(sales_rep)
            await session.commit()
            await session.refresh(sales_rep)
            print("Created sales rep.")
        else:
            print("Sales rep already exists.")

        print(f"SALES_REP_ID={sales_rep.id}")
        print(f"EMAIL={DEV_SALES_REP_EMAIL}")
        print(f"PASSWORD={DEV_SALES_REP_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(main())
