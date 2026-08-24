import PropTypes from "prop-types";
import { CheckCircle2, ClipboardList, ScrollText, Sparkles } from "lucide-react";

function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="mb-4 flex items-center gap-2 border-b border-line-soft pb-3">
      <Icon size={14} className="text-paper" />
      <p className="mono-eyebrow">{children}</p>
    </div>
  );
}

function SummaryCard({ summary }) {
  return (
    <section className="animate-reveal rounded-md border border-line bg-graphite p-6 shadow-soft">
      <div className="mb-6 flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-line text-paper">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="mono-eyebrow">AI Summary</p>
            <h2 className="font-display text-xl font-semibold text-paper">Meeting Intelligence</h2>
          </div>
        </div>
        {summary.detected_language ? (
          <span className="rounded-sm border border-line-soft px-2 py-1 font-mono text-[0.65rem] uppercase tracking-wide text-ash">
            {summary.detected_language}
          </span>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <article className="rounded-md border border-line-soft bg-panel p-5">
          <SectionLabel icon={ScrollText}>Executive Summary</SectionLabel>
          <p className="leading-7 text-mist">{summary.executive_summary}</p>
        </article>

        <article className="rounded-md border border-line-soft bg-panel p-5">
          <SectionLabel icon={CheckCircle2}>Key Decisions</SectionLabel>
          {summary.key_decisions.length ? (
            <ul className="space-y-2">
              {summary.key_decisions.map((decision) => (
                <li
                  key={decision}
                  className="rounded-sm border border-line-soft bg-ink px-3 py-2 text-sm leading-6 text-mist"
                >
                  {decision}
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-mono text-sm text-ash">No finalized decisions were detected.</p>
          )}
        </article>
      </div>

      <article className="mt-6 rounded-md border border-line-soft bg-panel p-5">
        <SectionLabel icon={ClipboardList}>Action Items</SectionLabel>
        {summary.action_items.length ? (
          <div className="overflow-hidden rounded-sm border border-line-soft">
            <table className="min-w-full divide-y divide-line-soft text-left text-sm">
              <thead className="bg-ink text-ash">
                <tr className="font-mono text-[0.65rem] uppercase tracking-[0.2em]">
                  <th className="px-4 py-3 font-medium">Task</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {summary.action_items.map((item) => (
                  <tr key={`${item.task}-${item.owner}-${item.deadline}`} className="hover:bg-ink/60">
                    <td className="px-4 py-4 text-mist">{item.task}</td>
                    <td className="px-4 py-4 font-mono text-xs uppercase tracking-wide text-paper">
                      {item.owner}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs uppercase tracking-wide text-ash">
                      {item.deadline}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="font-mono text-sm text-ash">No action items were detected.</p>
        )}
      </article>

      <article className="mt-6 rounded-md border border-line-soft bg-panel p-5">
        <SectionLabel icon={ScrollText}>Transcript</SectionLabel>
        <p className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-sm border border-line-soft bg-ink p-4 font-mono text-xs leading-6 text-ash">
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
    detected_language: PropTypes.string,
    id: PropTypes.number,
    created_at: PropTypes.string,
  }).isRequired,
};

export default SummaryCard;
