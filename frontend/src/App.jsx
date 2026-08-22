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
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10 lg:px-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-800/70 bg-slate-900/75 px-6 py-10 shadow-soft backdrop-blur lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.18),transparent_30%)]" />
        <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.35em] text-sky-300">
              Assessment Prototype
            </p>
            <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight text-white md:text-5xl">
              AI Meeting Summarizer with precise transcription and decision-grade outputs.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Upload a recorded meeting and receive a grounded executive summary, finalized
              decisions, and actionable follow-ups in a clean recruiter-friendly format.
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="animate-float rounded-[2rem] border border-slate-800/80 bg-slate-950/70 p-6 shadow-soft">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-500/10 text-sky-300">
                <AudioLines size={30} />
              </div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Current status</p>
              <p className="mt-3 text-2xl font-semibold text-white">{statusText}</p>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                Optimized for structured technical meeting outputs with strong guardrails against
                hallucinated ownership and deadlines.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[2rem] border border-slate-800/70 bg-slate-900/75 p-6 shadow-soft backdrop-blur">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Upload Audio</p>
            <h2 className="mt-2 font-display text-3xl text-white">Drop your meeting file here</h2>
            <p className="mt-3 text-slate-400">
              Supported formats: {SUPPORTED_EXTENSIONS.join(", ")}.
            </p>
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
            className={`flex min-h-72 w-full flex-col items-center justify-center rounded-[1.75rem] border border-dashed px-6 text-center transition ${
              isDragging
                ? "border-sky-400 bg-sky-500/10"
                : "border-slate-700 bg-slate-950/70 hover:border-sky-400/70 hover:bg-slate-950"
            }`}
          >
            <div className="rounded-3xl bg-sky-500/10 p-4 text-sky-300">
              <UploadCloud size={36} />
            </div>
            <p className="mt-5 text-xl font-semibold text-white">
              {selectedFile ? selectedFile.name : "Drag and drop or click to browse"}
            </p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
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
            <div className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-5 py-4 text-base font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/60"
          >
            {isLoading ? <LoaderCircle className="animate-spin" size={20} /> : <AudioLines size={20} />}
            {isLoading ? "Processing Meeting..." : "Generate Summary"}
          </button>
        </article>

        <div>
          {summary ? (
            <SummaryCard summary={summary} />
          ) : (
            <section className="flex h-full min-h-[28rem] items-center justify-center rounded-[2rem] border border-slate-800/70 bg-slate-900/60 p-8 text-center shadow-soft backdrop-blur">
              <div>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-emerald-500/10 text-emerald-300">
                  <AudioLines size={34} />
                </div>
                <h2 className="mt-6 font-display text-3xl text-white">Structured insights appear here</h2>
                <p className="mt-4 max-w-lg text-slate-400">
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
