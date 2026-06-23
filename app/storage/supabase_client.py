import asyncio
from functools import lru_cache

import httpx
from supabase import Client, ClientOptions, create_client

from app.config import settings
from app.network import prefer_ipv4_dns


@lru_cache
def get_supabase_client() -> Client:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("Supabase URL and service role key must be configured")

    if settings.app_env == "production":
        prefer_ipv4_dns()

    httpx_client = httpx.Client(timeout=60.0)
    options = ClientOptions(httpx_client=httpx_client)
    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
        options=options,
    )


def get_storage_bucket_name() -> str:
    return settings.supabase_storage_bucket


async def check_storage_health() -> None:
    """Verify Supabase Storage API is reachable (list bucket)."""

    def _list_bucket() -> None:
        client = get_supabase_client()
        bucket = get_storage_bucket_name()
        client.storage.from_(bucket).list("", {"limit": 1})

    await asyncio.to_thread(_list_bucket)
