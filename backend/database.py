from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Generator, List

from sqlmodel import Field, Session, SQLModel, create_engine, select

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "meeting_summarizer.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

# check_same_thread=False is required because FastAPI can use the connection
# across different threads within a single request/response cycle.
engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})


class MeetingSummaryRecord(SQLModel, table=True):
    """Persisted record of one transcription + summarization run."""

    id: int | None = Field(default=None, primary_key=True)
    filename: str
    transcription: str
    executive_summary: str
    key_decisions_json: str  # stored as a JSON-encoded string list
    action_items_json: str  # stored as a JSON-encoded string list of {task, owner, deadline}
    detected_language: str | None = None
    duration_seconds: float | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def to_response_dict(self) -> dict:
        # SQLite drops tzinfo on read even though we always write UTC values,
        # so re-attach it explicitly before serializing. Without this, clients
        # parse the timestamp as local time instead of UTC and timezone
        # conversion (e.g. to IST) silently produces the wrong result.
        created_at_utc = self.created_at
        if created_at_utc.tzinfo is None:
            created_at_utc = created_at_utc.replace(tzinfo=timezone.utc)

        return {
            "id": self.id,
            "filename": self.filename,
            "transcription": self.transcription,
            "executive_summary": self.executive_summary,
            "key_decisions": json.loads(self.key_decisions_json),
            "action_items": json.loads(self.action_items_json),
            "detected_language": self.detected_language,
            "duration_seconds": self.duration_seconds,
            "created_at": created_at_utc.isoformat(),
        }


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


def save_summary_record(
    session: Session,
    *,
    filename: str,
    transcription: str,
    executive_summary: str,
    key_decisions: list,
    action_items: list,
    detected_language: str | None,
    duration_seconds: float | None,
) -> MeetingSummaryRecord:
    record = MeetingSummaryRecord(
        filename=filename,
        transcription=transcription,
        executive_summary=executive_summary,
        key_decisions_json=json.dumps(key_decisions),
        action_items_json=json.dumps(action_items),
        detected_language=detected_language,
        duration_seconds=duration_seconds,
    )
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def list_summary_records(session: Session, limit: int = 50) -> List[MeetingSummaryRecord]:
    statement = select(MeetingSummaryRecord).order_by(
        MeetingSummaryRecord.created_at.desc()
    ).limit(limit)
    return list(session.exec(statement))


def get_summary_record(session: Session, record_id: int) -> MeetingSummaryRecord | None:
    return session.get(MeetingSummaryRecord, record_id)


def clear_all_summary_records(session: Session) -> int:
    """Delete every saved summary. Returns the number of records deleted."""
    records = list(session.exec(select(MeetingSummaryRecord)))
    count = len(records)
    for record in records:
        session.delete(record)
    session.commit()
    return count