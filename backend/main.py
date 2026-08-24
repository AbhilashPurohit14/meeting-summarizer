from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session

from config import get_settings
from database import (
    clear_all_summary_records,
    get_session,
    get_summary_record,
    init_db,
    list_summary_records,
    save_summary_record,
)
from models import (
    AppMetadataResponse,
    HealthResponse,
    ProviderConfig,
    SavedSummaryResponse,
    SummaryResponse,
)
from services.audio_service import AudioService
from services.llm_service import LLMService


settings = get_settings()
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
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
async def summarize_meeting(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
) -> SummaryResponse:
    transcription_result = await audio_service.transcribe(file)
    summary_payload = llm_service.summarize_transcript(transcription_result["text"])

    save_summary_record(
        session,
        filename=transcription_result["filename"],
        transcription=transcription_result["text"],
        executive_summary=summary_payload["executive_summary"],
        key_decisions=summary_payload["key_decisions"],
        action_items=summary_payload["action_items"],
        detected_language=transcription_result["language"],
        duration_seconds=transcription_result["duration"],
    )

    return SummaryResponse(
        filename=transcription_result["filename"],
        transcription=transcription_result["text"],
        executive_summary=summary_payload["executive_summary"],
        key_decisions=summary_payload["key_decisions"],
        action_items=summary_payload["action_items"],
        detected_language=transcription_result["language"],
        duration_seconds=transcription_result["duration"],
    )


@app.get("/api/summaries", response_model=list[SavedSummaryResponse])
async def get_summary_history(session: Session = Depends(get_session)) -> list[SavedSummaryResponse]:
    records = list_summary_records(session)
    return [SavedSummaryResponse(**record.to_response_dict()) for record in records]


@app.get("/api/summaries/{record_id}", response_model=SavedSummaryResponse)
async def get_summary_by_id(
    record_id: int, session: Session = Depends(get_session)
) -> SavedSummaryResponse:
    record = get_summary_record(session, record_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary not found.")
    return SavedSummaryResponse(**record.to_response_dict())


@app.delete("/api/summaries")
async def clear_summary_history(session: Session = Depends(get_session)) -> dict:
    deleted_count = clear_all_summary_records(session)
    return {"deleted_count": deleted_count}