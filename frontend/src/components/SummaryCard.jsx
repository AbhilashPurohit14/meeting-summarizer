import PropTypes from "prop-types";
import { CheckCircle2, ClipboardList, Sparkles } from "lucide-react";

function SummaryCard({ summary }) {
  return (
    <section className="animate-reveal rounded-3xl border border-slate-800/80 bg-slate-900/80 p-6 shadow-soft backdrop-blur">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-300">
          <Sparkles size={22} />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">AI Summary</p>
          <h2 className="font-display text-2xl text-white">Meeting Intelligence</h2>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
          <h3 className="mb-3 text-lg font-semibold text-white">Executive Summary</h3>
          <p className="leading-7 text-slate-300">{summary.executive_summary}</p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-300" />
            <h3 className="text-lg font-semibold text-white">Key Decisions</h3>
          </div>
          {summary.key_decisions.length ? (
            <ul className="space-y-3 text-slate-300">
              {summary.key_decisions.map((decision) => (
                <li key={decision} className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                  {decision}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400">No finalized decisions were detected.</p>
          )}
        </article>
      </div>

      <article className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardList size={18} className="text-sky-300" />
          <h3 className="text-lg font-semibold text-white">Action Items</h3>
        </div>
        {summary.action_items.length ? (
          <div className="overflow-hidden rounded-2xl border border-slate-800">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Task</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/80 text-slate-200">
                {summary.action_items.map((item) => (
                  <tr key={`${item.task}-${item.owner}-${item.deadline}`}>
                    <td className="px-4 py-4">{item.task}</td>
                    <td className="px-4 py-4">{item.owner}</td>
                    <td className="px-4 py-4">{item.deadline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-400">No action items were detected.</p>
        )}
      </article>

      <article className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
        <h3 className="mb-3 text-lg font-semibold text-white">Transcript</h3>
        <p className="max-h-64 overflow-y-auto whitespace-pre-wrap leading-7 text-slate-300">
          {summary.transcription}
        </p>
      </article>
    </section>
  );
}

SummaryCard.propTypes = {
  summary: PropTypes.shape({
    executive_summary: PropTypes.string.isRequired,
    key_decisions: PropTypes.arrayOf(PropTypes.string).isRequired,
    action_items: PropTypes.arrayOf(
      PropTypes.shape({
        task: PropTypes.string.isRequired,
        owner: PropTypes.string.isRequired,
        deadline: PropTypes.string.isRequired,
      }),
    ).isRequired,
    transcription: PropTypes.string.isRequired,
  }).isRequired,
};

export default SummaryCard;
