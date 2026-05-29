from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    fastf1_cache_dir: str = "./cache"
    season: int = 2026
    cors_origins: str = "http://localhost:3000"
    jolpica_base_url: str = "https://api.jolpi.ca/ergast/f1"
    llm_cache_ttl_seconds: int = 86400

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def cache_path(self) -> Path:
        return Path(self.fastf1_cache_dir)


settings = Settings()
