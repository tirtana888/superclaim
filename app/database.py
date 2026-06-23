from collections.abc import AsyncGenerator
import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings
from app.network import prefer_ipv4_dns

logger = logging.getLogger(__name__)

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
    global _engine
    if _engine is None:
        if not settings.supabase_db_url:
            raise RuntimeError("SUPABASE_DB_URL is not configured")
        if settings.app_env == "production":
            prefer_ipv4_dns()
            if ".supabase.co" in settings.supabase_db_url:
                # Direct Supabase connections (db.<ref>.supabase.co) are IPv6-only and
                # unreachable from IPv4-only hosts like Railway. Use the Supavisor pooler
                # (aws-<n>-<region>.pooler.supabase.com) instead.
                logger.warning(
                    "SUPABASE_DB_URL uses the direct (IPv6-only) Supabase host. "
                    "On IPv4-only platforms this fails with [Errno 101]. "
                    "Switch to the Supabase connection pooler host."
                )
        _engine = create_async_engine(
            settings.supabase_db_url,
            echo=settings.debug,
            pool_pre_ping=True,
            connect_args={"ssl": "require", "statement_cache_size": 0},
        )
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    session_factory = get_session_factory()
    async with session_factory() as session:
        yield session


async def check_db_health() -> None:
    """Verify the Postgres database is reachable (SELECT 1)."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        await session.execute(text("SELECT 1"))
