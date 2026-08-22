from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from config import get_settings
from models import AppMetadataResponse, HealthResponse, ProviderConfig, SummaryResponse
from services.audio_service import AudioService
from services.llm_service import LLMService


settings = get_settings()
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield


app = FastAPI(
    title="AI Meeting Summarizer API",
    version="1.0.0",
    summary="Upload meeting audio and receive a structured summary.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

audio_service = AudioService(settings)
llm_service = LLMService(settings)

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(status="ok")


@app.get("/api/meta", response_model=AppMetadataResponse)
async def app_metadata() -> AppMetadataResponse:
    return AppMetadataResponse(
        app_name="AI Meeting Summarizer",
        status="ready",
        provider_config=ProviderConfig(
            asr_provider=settings.asr_provider,
            asr_model=settings.asr_model,
            llm_provider=settings.llm_provider,
            llm_model=settings.llm_model,
        ),
        demo_tips=[
            "Use a short, clean meeting clip under 25 MB for the smoothest demo.",
            "If Gemini rejects the configured model, switch LLM_MODEL to a Flash model enabled in your account.",
            "If Groq rate limits the file, retry after a short pause or use a smaller audio clip.",
        ],
    )


@app.get("/", include_in_schema=False)
async def serve_frontend() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.post("/api/summarize", response_model=SummaryResponse)
async def summarize_meeting(file: UploadFile = File(...)) -> SummaryResponse:
    transcription_result = await audio_service.transcribe(file)
    summary_payload = llm_service.summarize_transcript(transcription_result["text"])

    return SummaryResponse(
        filename=transcription_result["filename"],
        transcription=transcription_result["text"],
        executive_summary=summary_payload["executive_summary"],
        key_decisions=summary_payload["key_decisions"],
        action_items=summary_payload["action_items"],
        detected_language=transcription_result["language"],
        duration_seconds=transcription_result["duration"],
    )
