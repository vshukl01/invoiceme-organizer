from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # Worker auth
    WORKER_API_TOKEN: str = Field(default="")

    # Supabase
    SUPABASE_URL: str = Field(default="")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="")

    # Google service account JSON (paste full JSON as a single env var)
    GOOGLE_SERVICE_ACCOUNT_JSON: str = Field(default="")

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


# ✅ this is what main.py imports
settings = get_settings()
