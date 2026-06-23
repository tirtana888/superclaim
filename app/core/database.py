"""Core data-access helpers shared across planes.

Re-exports the async session dependency and provides the mandatory
tenant-isolation query helper. Every data access MUST be tenant-scoped.
"""

from __future__ import annotations

from typing import TypeVar
from uuid import UUID

from sqlalchemy import Select, select

from app.database import get_db, get_engine, get_session_factory

__all__ = ["get_db", "get_engine", "get_session_factory", "tenant_query"]

T = TypeVar("T")


def tenant_query(model: type[T], tenant_id: UUID) -> Select[tuple[T]]:
    """Build a SELECT for ``model`` already filtered by ``tenant_id``.

    Use this for EVERY tenant-owned table read. Never write a raw select()
    against a tenant-owned table without this filter.
    """
    return select(model).where(model.tenant_id == tenant_id)  # type: ignore[attr-defined]
