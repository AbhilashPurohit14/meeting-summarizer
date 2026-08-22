from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    openai_api_key: str = Field(default="")
    anthropic_api_key: str = Field(default="")
    groq_api_key: str = Field(default="")
    gemini_api_key: str = Field(default="")
    llm_provider: str = Field(default="gemini")
    llm_model: str = Field(default="gemini-3.7-flash")
    asr_provider: str = Field(default="groq")
    asr_model: str = Field(default="whisper-large-v3")
    max_file_size_mb: int = Field(default=25)
    cors_origins: str = Field(default="http://localhost:5173")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def allowed_origins(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
