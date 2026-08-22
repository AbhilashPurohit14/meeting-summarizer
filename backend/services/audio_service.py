from __future__ import annotations

from io import BytesIO
from pathlib import Path
from typing import Any

from fastapi import HTTPException, UploadFile, status
from openai import OpenAI

from config import Settings


SUPPORTED_AUDIO_EXTENSIONS = {
    ".flac",
    ".m4a",
    ".mp3",
    ".mp4",
    ".mpeg",
    ".mpga",
    ".ogg",
    ".wav",
    ".webm",
}


class AudioService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._groq_client = (
            OpenAI(
                api_key=settings.groq_api_key,
                base_url="https://api.groq.com/openai/v1",
            )
            if settings.groq_api_key
            else None
        )

    async def validate_upload(self, upload_file: UploadFile) -> bytes:
        if not upload_file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Audio file name is missing.",
            )

        extension = Path(upload_file.filename).suffix.lower()
        if extension not in SUPPORTED_AUDIO_EXTENSIONS:
            supported = ", ".join(sorted(SUPPORTED_AUDIO_EXTENSIONS))
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported audio format. Supported formats: {supported}.",
            )

        file_bytes = await upload_file.read()
        max_bytes = self.settings.max_file_size_mb * 1024 * 1024
        if len(file_bytes) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=(
                    f"Audio file exceeds the {self.settings.max_file_size_mb} MB upload limit."
                ),
            )

        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded audio file is empty.",
            )

        return file_bytes

    async def transcribe(self, upload_file: UploadFile) -> dict[str, Any]:
        file_bytes = await self.validate_upload(upload_file)

        if self.settings.asr_provider != "groq":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Only the Groq ASR provider is configured in this prototype.",
            )

        if not self._groq_client:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="GROQ_API_KEY is not configured.",
            )

        buffer = BytesIO(file_bytes)
        buffer.name = upload_file.filename or "meeting-audio.wav"

        try:
            response = self._groq_client.audio.transcriptions.create(
                file=buffer,
                model=self.settings.asr_model,
                response_format="verbose_json",
            )
        except Exception as exc:
            error_message = str(exc)
            if "401" in error_message or "authentication" in error_message.lower():
                detail = (
                    "Groq authentication failed. Check GROQ_API_KEY in backend/.env and "
                    "make sure the key belongs to an active Groq account."
                )
            elif "429" in error_message or "rate limit" in error_message.lower():
                detail = (
                    "Groq rate limit reached on the free tier. Retry in a moment or switch "
                    "to whisper-large-v3-turbo for lighter usage."
                )
            else:
                detail = f"Transcription request failed: {exc}"
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=detail,
            ) from exc

        transcript_text = getattr(response, "text", "").strip()
        if not transcript_text:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Groq returned an empty transcript. Try a clearer recording or shorter file.",
            )

        return {
            "filename": upload_file.filename,
            "text": transcript_text,
            "language": getattr(response, "language", None),
            "duration": getattr(response, "duration", None),
        }
