#!/usr/bin/env python3
"""Create the first platform superadmin account."""

from __future__ import annotations

import argparse
import asyncio
import getpass
import sys

from sqlalchemy import func, select

from app.core.security import hash_password
from app.database import get_session_factory
from app.models.platform_admin import PlatformAdmin


async def _run(email: str, password: str) -> None:
    email = email.strip().lower()
    if len(password) < 8:
        print("Password must be at least 8 characters.", file=sys.stderr)
        sys.exit(1)

    async with get_session_factory()() as db:
        existing = await db.execute(select(PlatformAdmin).where(PlatformAdmin.email == email))
        if existing.scalar_one_or_none() is not None:
            print(f"Platform admin already exists for {email}")
            return

        count = (await db.execute(select(func.count(PlatformAdmin.id)))).scalar_one()
        if int(count) > 0:
            print("A platform admin already exists. Use a different email or disable the existing admin first.")
            sys.exit(1)

        admin = PlatformAdmin(
            email=email,
            password_hash=hash_password(password),
            status="active",
        )
        db.add(admin)
        await db.commit()
        print(f"Created platform superadmin: {email}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the first SuperClaim platform superadmin")
    parser.add_argument("--email", required=True, help="Superadmin email")
    parser.add_argument("--password", help="Superadmin password (prompted if omitted)")
    args = parser.parse_args()
    password = args.password or getpass.getpass("Password: ")
    asyncio.run(_run(args.email, password))


if __name__ == "__main__":
    main()
