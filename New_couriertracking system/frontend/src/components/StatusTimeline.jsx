import StatusBadge from "./StatusBadge";

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

const StatusTimeline = ({ history = [] }) => (
  <div className="space-y-5">
    {history.map((entry, index) => (
      <div key={`${entry.status}-${entry.timestamp}-${index}`} className="flex gap-4">
        <div className="flex w-5 flex-col items-center">
          <span className="mt-2 h-3 w-3 rounded-full bg-teal-500" />
          {index !== history.length - 1 ? (
            <span className="mt-2 h-full w-px bg-slate-200 dark:bg-slate-700" />
          ) : null}
        </div>
        <div className="pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={entry.status} />
            <span className="text-sm" style={{ color: "rgb(var(--muted))" }}>
              {formatDate(entry.timestamp)}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6">{entry.message}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em]" style={{ color: "rgb(var(--muted))" }}>
            {entry.location}
          </p>
        </div>
      </div>
    ))}
  </div>
);

export default StatusTimeline;

