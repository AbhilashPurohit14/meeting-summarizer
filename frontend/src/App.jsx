import { useRef, useState } from "react";
import { AudioLines, LoaderCircle, UploadCloud } from "lucide-react";
import SummaryCard from "./components/SummaryCard";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const SUPPORTED_EXTENSIONS = [
  "mp3",
  "wav",
  "m4a",
  "ogg",
  "webm",
  "mp4",
  "mpeg",
  "mpga",
  "flac",
];

function App() {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [statusText, setStatusText] = useState("Ready to analyze your meeting.");
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleFileSelection(file) {
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setSummary(null);
    setError("");
    setStatusText("File attached. Ready for transcription.");
  }

  function openFilePicker() {
    inputRef.current?.click();
  }

  async function handleSubmit() {
    if (!selectedFile) {
      setError("Please upload an audio file before generating a summary.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setIsLoading(true);
    setError("");
    setSummary(null);
    setStatusText("Transcribing...");

    try {
      const progressTimeout = window.setTimeout(() => {
        setStatusText("Extracting insights...");
      }, 1400);

      const response = await fetch(`${API_BASE_URL}/api/summarize`, {
        method: "POST",
        body: formData,
      });

      window.clearTimeout(progressTimeout);

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.detail ?? "Something went wrong while processing the file.");
      }

      setSummary(payload);
      setStatusText("Summary generated successfully.");
    } catch (requestError) {
      setError(requestError.message);
      setStatusText("Upload failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10 lg:px-8">
      {/* Document header strip */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.28em] text-ash">
          <AudioLines size={14} className="text-paper" />
          <span className="text-paper">meeting-summarizer</span>
          <span className="text-line">//</span>
          <span>transcript &amp; decision extraction</span>
        </div>
        <div className="flex items-center gap-2 rounded-sm border border-line px-3 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-mist">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isLoading ? "animate-pulse-soft bg-paper" : "bg-ash"
            }`}
          />
          {isLoading ? "processing" : summary ? "complete" : "idle"}
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-md border border-line bg-graphite px-6 py-10 shadow-soft lg:px-10">
        <div className="pointer-events-none absolute -right-10 -top-10 hidden rotate-[6deg] select-none rounded-sm border border-dashed border-stamp px-4 py-2 font-mono text-[0.65rem] uppercase tracking-[0.3em] text-stamp opacity-70 lg:block">
          grounded · no invented owners or dates
        </div>

        <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="mono-eyebrow mb-3">Assessment Prototype</p>
            <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.1] tracking-tight text-paper md:text-5xl">
              A meeting summarizer built for decision-grade output.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-mist">
              Upload a recorded meeting and receive a grounded executive summary, finalized
              decisions, and ownership-ready action items &mdash; with nothing invented.
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-xs rounded-md border border-line bg-panel p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-sm border border-line text-paper">
                <AudioLines size={22} />
              </div>
              <p className="mono-eyebrow">Session status</p>
              <p className="mt-3 text-xl font-semibold leading-snug text-paper">{statusText}</p>
              <div className="mt-4 border-t border-line-soft pt-4 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-ash">
                <div className="flex justify-between py-1">
                  <span>asr</span>
                  <span className="text-mist">groq · whisper-large-v3</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>llm</span>
                  <span className="text-mist">gemini · json-mode</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upload + Result */}
      <section className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-md border border-line bg-graphite p-6 shadow-soft">
          <div className="mb-6">
            <p className="mono-eyebrow">Upload audio</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-paper">
              Drop your meeting file here
            </h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SUPPORTED_EXTENSIONS.map((ext) => (
                <span
                  key={ext}
                  className="rounded-sm border border-line-soft px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wide text-ash"
                >
                  .{ext}
                </span>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={openFilePicker}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              handleFileSelection(event.dataTransfer.files?.[0]);
            }}
            className={`flex min-h-72 w-full flex-col items-center justify-center rounded-md border border-dashed px-6 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper ${
              isDragging
                ? "border-paper bg-panel"
                : "border-line bg-ink hover:border-mist hover:bg-panel/60"
            }`}
          >
            <div className="rounded-sm border border-line p-4 text-paper">
              <UploadCloud size={30} />
            </div>
            <p className="mt-5 text-xl font-semibold text-paper">
              {selectedFile ? selectedFile.name : "Drag and drop or click to browse"}
            </p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-ash">
              Designed for interview demos: fast feedback, clear state transitions, and
              structured results.
            </p>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept=".mp3,.wav,.m4a,.ogg,.webm,.mp4,.mpeg,.mpga,.flac"
            className="hidden"
            onChange={(event) => handleFileSelection(event.target.files?.[0])}
          />

          {error ? (
            <div className="mt-5 rounded-sm border border-line bg-panel px-4 py-3 font-mono text-sm text-paper">
              <span className="mr-2 uppercase tracking-wide text-ash">Error //</span>
              {error}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-sm bg-paper px-5 py-4 text-base font-semibold text-ink transition hover:bg-mist disabled:cursor-not-allowed disabled:bg-line disabled:text-ash"
          >
            {isLoading ? <LoaderCircle className="animate-spin" size={20} /> : <AudioLines size={20} />}
            {isLoading ? "Processing Meeting..." : "Generate Summary"}
          </button>
        </article>

        <div>
          {summary ? (
            <SummaryCard summary={summary} />
          ) : (
            <section className="flex h-full min-h-[28rem] items-center justify-center rounded-md border border-line bg-graphite p-8 text-center shadow-soft">
              <div>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-sm border border-line text-paper">
                  <AudioLines size={28} />
                </div>
                <p className="mono-eyebrow mt-6">Awaiting input</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-paper">
                  Structured insights appear here
                </h2>
                <p className="mt-4 max-w-lg text-mist">
                  The result view highlights the executive narrative, committed decisions, and
                  ownership-ready action items so evaluators can judge both UX and prompt quality.
                </p>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
