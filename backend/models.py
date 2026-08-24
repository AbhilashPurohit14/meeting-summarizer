from typing import List

from pydantic import BaseModel, Field


class ActionItem(BaseModel):
    task: str = Field(..., description="A concrete follow-up task.")
    owner: str = Field(..., description='Task owner or "Unassigned" if not specified.')
    deadline: str = Field(..., description='Deadline text or "Not specified" if absent.')


class SummaryResponse(BaseModel):
    filename: str
    transcription: str
    executive_summary: str
    key_decisions: List[str]
    action_items: List[ActionItem]
    detected_language: str | None = None
    duration_seconds: float | None = None


class SavedSummaryResponse(SummaryResponse):
    id: int
    created_at: str


class HealthResponse(BaseModel):
    status: str


class ProviderConfig(BaseModel):
    asr_provider: str
    asr_model: str
    llm_provider: str
    llm_model: str


class AppMetadataResponse(BaseModel):
    app_name: str
    status: str
    provider_config: ProviderConfig
    demo_tips: List[str]
