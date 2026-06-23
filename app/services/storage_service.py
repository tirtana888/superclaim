import asyncio
import base64
import binascii
from dataclasses import dataclass

from app.storage.supabase_client import get_storage_bucket_name, get_supabase_client

SIGNED_URL_EXPIRY_SECONDS = 600  # 10 minutes
MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB


@dataclass(frozen=True)
class UploadedImage:
    path: str
    filename: str
    content_type: str
    size_bytes: int


def build_storage_path(tenant_id: str, claim_id: str, filename: str) -> str:
    return f"{tenant_id}/{claim_id}/{filename}"


def decode_image_content(content_base64: str) -> bytes:
    payload = content_base64.strip()
    if payload.startswith("data:"):
        _, _, payload = payload.partition(",")
    try:
        content = base64.b64decode(payload, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValueError("Invalid base64 image content") from exc

    if not content:
        raise ValueError("Image content is empty")
    if len(content) > MAX_IMAGE_BYTES:
        raise ValueError(f"Image exceeds maximum size of {MAX_IMAGE_BYTES} bytes")
    return content


def _upload_bytes(path: str, content: bytes, content_type: str) -> None:
    try:
        client = get_supabase_client()
        bucket = get_storage_bucket_name()
        client.storage.from_(bucket).upload(
            path=path,
            file=content,
            file_options={"content-type": content_type, "upsert": "false"},
        )
    except OSError as exc:
        raise RuntimeError(
            f"Supabase Storage unreachable ({exc}). "
            "Check SUPABASE_URL and outbound network from Railway."
        ) from exc


def _create_signed_url(path: str, expires_in: int) -> str:
    client = get_supabase_client()
    bucket = get_storage_bucket_name()
    response = client.storage.from_(bucket).create_signed_url(path, expires_in)
    signed_url = response.get("signedURL") or response.get("signedUrl")
    if not signed_url:
        raise RuntimeError("Failed to generate signed URL from Supabase")
    return signed_url


async def upload_claim_image(
    tenant_id: str,
    claim_id: str,
    filename: str,
    content_base64: str,
    content_type: str,
) -> UploadedImage:
    content = decode_image_content(content_base64)
    path = build_storage_path(tenant_id, claim_id, filename)
    await asyncio.to_thread(_upload_bytes, path, content, content_type)
    return UploadedImage(
        path=path,
        filename=filename,
        content_type=content_type,
        size_bytes=len(content),
    )


def _download_bytes(path: str) -> bytes:
    client = get_supabase_client()
    bucket = get_storage_bucket_name()
    response = client.storage.from_(bucket).download(path)
    if isinstance(response, bytes):
        return response
    return bytes(response)


async def download_claim_image(path: str) -> bytes:
    return await asyncio.to_thread(_download_bytes, path)


async def create_signed_url(
    path: str,
    expires_in: int = SIGNED_URL_EXPIRY_SECONDS,
) -> str:
    return await asyncio.to_thread(_create_signed_url, path, expires_in)


async def create_signed_urls(
    paths: list[str],
    expires_in: int = SIGNED_URL_EXPIRY_SECONDS,
) -> dict[str, str]:
    urls: dict[str, str] = {}
    for path in paths:
        urls[path] = await create_signed_url(path, expires_in=expires_in)
    return urls
