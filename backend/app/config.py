from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    gemini_api_key: str
    tavily_api_key: str

    langsmith_tracing: bool = False
    langsmith_api_key: str = ""
    langsmith_project: str = "verinews"
    langchain_tracing_v2: bool = False
    langsmith_endpoint: str = ""

    cors_origins: list[str] = ["http://localhost:3000"]
    cache_ttl_seconds: int = 1800
    cache_max_size: int = 256
    log_level: str = "INFO"
    gemini_model: str = "gemini-2.0-flash"
    tavily_search_days: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: object) -> list[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v  # type: ignore[return-value]


settings = Settings()
