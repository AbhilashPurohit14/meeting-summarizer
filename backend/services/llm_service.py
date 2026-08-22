from __future__ import annotations

from fastapi import HTTPException, status
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from config import Settings
from models import ActionItem

SYSTEM_PROMPT = """
You are an expert meeting analyst for technical and business discussions.

Your task is to transform a raw meeting transcript into a precise JSON object.
You must be conservative, grounded, and non-speculative.

Rules:
1. Use only information explicitly stated in the transcript.
2. Never invent decisions, owners, dates, blockers, or next steps.
3. If an owner is not clearly mentioned, use "Unassigned".
4. If a deadline is not clearly mentioned, use "Not specified".
5. The executive summary must be exactly 3 sentences.
6. Each key decision must describe a finalized or strongly confirmed decision. Do not include open questions.
7. Each action item must be concrete and execution-oriented.
8. If the transcript does not contain any finalized decisions, return an empty array for key_decisions.
9. If the transcript does not contain any action items, return an empty array for action_items.
10. Return valid JSON only. Do not wrap the JSON in markdown fences or prose.

Required JSON schema:
{
  "executive_summary": "string",
  "key_decisions": ["string"],
  "action_items": [
    {
      "task": "string",
      "owner": "string",
      "deadline": "string"
    }
  ]
}

Few-shot example:
Transcript:
"Priya confirmed we will ship the beta dashboard on September 15. Alex will finalize the API contract by next Tuesday. The team agreed to postpone SSO until phase two."

Expected JSON:
{
  "executive_summary": "The team aligned on the near-term release plan for the beta dashboard. They confirmed the shipping target and narrowed scope by deferring non-critical work. A follow-up task was assigned to finalize the API contract before implementation continues.",
  "key_decisions": [
    "The beta dashboard will ship on September 15.",
    "SSO is postponed until phase two."
  ],
  "action_items": [
    {
      "task": "Finalize the API contract.",
      "owner": "Alex",
      "deadline": "next Tuesday"
    }
  ]
}
""".strip()


class GeminiActionItem(BaseModel):
    task: str = Field(description="A concrete follow-up task from the meeting transcript.")
    owner: str = Field(description='Owner of the task or "Unassigned" if missing.')
    deadline: str = Field(description='Deadline text or "Not specified" if no deadline is mentioned.')


class GeminiSummaryPayload(BaseModel):
    executive_summary: str = Field(description="Exactly three sentences summarizing the meeting.")
    key_decisions: list[str] = Field(
        description="Finalized or strongly confirmed decisions only."
    )
    action_items: list[GeminiActionItem] = Field(
        description="Concrete follow-up tasks extracted from the transcript."
    )


class LLMService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._gemini_client = (
            genai.Client(api_key=settings.gemini_api_key) if settings.gemini_api_key else None
        )

    def summarize_transcript(self, transcript: str) -> dict:
        if not transcript.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transcript is empty after transcription.",
            )

        if self.settings.llm_provider != "gemini":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Only the Gemini LLM provider is configured in this prototype.",
            )

        parsed = self._summarize_with_gemini(transcript)

        executive_summary = parsed.executive_summary.strip()
        key_decisions = parsed.key_decisions
        action_items = parsed.action_items

        if not executive_summary or not isinstance(key_decisions, list) or not isinstance(
            action_items, list
        ):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="LLM response did not match the expected schema.",
            )

        validated_items = [ActionItem(**item.model_dump()).model_dump() for item in action_items]

        return {
            "executive_summary": executive_summary,
            "key_decisions": [str(item).strip() for item in key_decisions if str(item).strip()],
            "action_items": validated_items,
        }

    def _summarize_with_gemini(self, transcript: str) -> GeminiSummaryPayload:
        if not self._gemini_client:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="GEMINI_API_KEY is not configured.",
            )

        try:
            response = self._gemini_client.models.generate_content(
                model=self.settings.llm_model,
                contents=f"{SYSTEM_PROMPT}\n\nTranscript:\n{transcript}\n\nReturn the JSON now.",
                config=types.GenerateContentConfig(
                    temperature=0.2,
                    response_mime_type="application/json",
                    response_schema=GeminiSummaryPayload,
                ),
            )
        except Exception as exc:
            error_message = str(exc)
            if "401" in error_message or "api key" in error_message.lower():
                detail = (
                    "Gemini authentication failed. Check GEMINI_API_KEY in backend/.env and "
                    "verify the key is enabled for the Gemini API."
                )
            elif "429" in error_message or "quota" in error_message.lower():
                detail = (
                    "Gemini free-tier quota was reached. Retry later or switch to another "
                    "Gemini Flash model available in your account."
                )
            elif "404" in error_message or "model" in error_message.lower():
                detail = (
                    f'Gemini model "{self.settings.llm_model}" is not available for this key. '
                    "Try a currently enabled Gemini Flash model in your account."
                )
            else:
                detail = f"Summarization request failed: {exc}"
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=detail,
            ) from exc

        try:
            parsed = response.parsed
            if isinstance(parsed, GeminiSummaryPayload):
                return parsed
            if isinstance(parsed, dict):
                return GeminiSummaryPayload(**parsed)
            if getattr(response, "text", None):
                return GeminiSummaryPayload.model_validate_json(response.text)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to parse Gemini structured output: {exc}",
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gemini returned an empty or unparsable response.",
        )
