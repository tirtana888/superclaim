from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    app_version: str = "0.2.0"
    debug: bool = True

    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_db_url: str = ""
    supabase_storage_bucket: str = "claim-media"

    redis_url: str = "redis://localhost:6379/0"

    secret_key: str = "change-me-in-production"
    api_key_header: str = "X-API-Key"
    tenant_id_header: str = "X-Tenant-ID"

    gemini_api_key: str = ""
    gemini_vision_model: str = "gemini-3.5-flash"
    mistral_api_key: str = ""
    mistral_ocr_model: str = "mistral-ocr-latest"

    mlflow_tracking_uri: str = "http://localhost:5000"
    fraud_model_path: str = "models/fraud_lgbm.txt"
    sentry_dsn: str = ""


settings = Settings()
