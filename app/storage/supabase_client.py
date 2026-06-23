from functools import lru_cache

from supabase import Client, create_client

from app.config import settings


@lru_cache
def get_supabase_client() -> Client:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("Supabase URL and service role key must be configured")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def get_storage_bucket_name() -> str:
    return settings.supabase_storage_bucket
