import os

import pytest

from app.config import settings


@pytest.fixture(autouse=True)
def configure_test_env(monkeypatch: pytest.MonkeyPatch) -> None:
    db_url = os.getenv(
        "SUPABASE_DB_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres",
    )
    monkeypatch.setenv("SUPABASE_DB_URL", db_url)
    monkeypatch.setattr(settings, "supabase_db_url", db_url)
