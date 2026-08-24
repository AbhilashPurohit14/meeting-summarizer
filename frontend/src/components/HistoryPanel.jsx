import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Clock,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import SummaryCard from "./SummaryCard";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

function formatTimestamp(isoString) {
  try {
    const formatted = new Date(isoString).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });
    return `${formatted} IST`;
  } catch {
    return isoString;
  }
}

function HistoryPanel() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearError, setClearError] = useState("");

  async function loadHistory() {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/summaries`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.detail ?? "Could not load summary history.");
      }
      setRecords(payload);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function handleClearHistory() {
    setIsClearing(true);
    setClearError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/summaries`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail ?? "Could not clear summary history.");
      }
      setRecords([]);
      setExpandedId(null);
      setIsConfirmingClear(false);
    } catch (requestError) {
      setClearError(requestError.message);
    } finally {
      setIsClearing(false);
    }
  }

  if (isLoading) {
    return (
      <section className="flex min-h-[24rem] items-center justify-center rounded-md border border-line bg-graphite p-8 shadow-soft">
        <div className="flex items-center gap-3 font-mono text-sm uppercase tracking-[0.2em] text-ash">
          <LoaderCircle className="animate-spin" size={18} />
          Loading session log...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-md border border-line bg-graphite p-8 shadow-soft">
        <p className="mono-eyebrow mb-3">Error</p>
        <p className="font-mono text-sm text-paper">{error}</p>
      </section>
    );
  }

  if (records.length === 0) {
    return (
      <section className="flex min-h-[24rem] flex-col items-center justify-center rounded-md border border-line bg-graphite p-8 text-center shadow-soft">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-sm border border-line text-paper">
          <Clock size={28} />
        </div>
        <p className="mono-eyebrow mt-6">Empty log</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-paper">
          No summaries generated yet
        </h2>
        <p className="mt-4 max-w-lg text-mist">
          Every meeting you summarize is saved here automatically. Generate your first summary
          to start building a session log.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-md border border-line bg-graphite shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5">
        <div>
          <p className="mono-eyebrow">Session log</p>
          <h2 className="mt-1 font-display text-xl font-semibold text-paper">
            Past summaries
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-sm border border-line-soft px-2 py-1 font-mono text-[0.7rem] uppercase tracking-wide text-ash">
            {records.length} saved
          </span>

          {!isConfirmingClear ? (
            <button
              type="button"
              onClick={() => {
                setIsConfirmingClear(true);
                setClearError("");
              }}
              className="flex items-center gap-2 rounded-sm border border-line-soft px-3 py-1.5 font-mono text-[0.7rem] uppercase tracking-wide text-ash transition hover:border-mist hover:text-paper"
            >
              <Trash2 size={13} />
              Clear history
            </button>
          ) : null}
        </div>
      </div>

      {isConfirmingClear ? (
        <div className="border-b border-line-soft bg-ink/60 px-6 py-4">
          <div className="flex flex-wrap items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-paper" />
            <div className="flex-1">
              <p className="font-semibold text-paper">
                Delete all {records.length} saved {records.length === 1 ? "summary" : "summaries"}?
              </p>
              <p className="mt-1 text-sm text-mist">
                This permanently removes every transcript, summary, and action item in your
                session log. This cannot be undone.
              </p>
              {clearError ? (
                <p className="mt-2 font-mono text-xs text-paper">Error // {clearError}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmingClear(false)}
                disabled={isClearing}
                className="rounded-sm border border-line-soft px-4 py-2 font-mono text-xs uppercase tracking-wide text-mist transition hover:border-mist hover:text-paper disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearHistory}
                disabled={isClearing}
                className="flex items-center gap-2 rounded-sm bg-paper px-4 py-2 font-mono text-xs uppercase tracking-wide text-ink transition hover:bg-mist disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isClearing ? <LoaderCircle className="animate-spin" size={14} /> : null}
                {isClearing ? "Deleting..." : "Yes, delete all"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ul className="divide-y divide-line-soft">
        {records.map((record) => {
          const isExpanded = expandedId === record.id;
          return (
            <li key={record.id}>
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : record.id)}
                className="flex w-full items-center gap-4 px-6 py-4 text-left transition hover:bg-panel/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-paper"
              >
                {isExpanded ? (
                  <ChevronDown size={16} className="shrink-0 text-ash" />
                ) : (
                  <ChevronRight size={16} className="shrink-0 text-ash" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-paper">{record.filename}</p>
                  <p className="mt-1 truncate text-sm text-mist">{record.executive_summary}</p>
                </div>
                <div className="hidden shrink-0 items-center gap-3 font-mono text-[0.65rem] uppercase tracking-wide text-ash sm:flex">
                  <span className="rounded-sm border border-line-soft px-2 py-0.5">
                    {record.key_decisions.length} decisions
                  </span>
                  <span className="rounded-sm border border-line-soft px-2 py-0.5">
                    {record.action_items.length} tasks
                  </span>
                  <span>{formatTimestamp(record.created_at)}</span>
                </div>
              </button>

              {isExpanded ? (
                <div className="border-t border-line-soft bg-ink/40 p-6">
                  <SummaryCard summary={record} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default HistoryPanel;
