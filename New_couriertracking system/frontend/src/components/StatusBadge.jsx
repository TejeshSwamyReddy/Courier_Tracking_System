const STATUS_STYLES = {
  "Order Placed": "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
  "Picked Up": "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200",
  "In Transit": "bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-200",
  Delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200"
};

const StatusBadge = ({ status }) => (
  <span className={`status-pill ${STATUS_STYLES[status] || "bg-slate-100 text-slate-800"}`}>
    <span className="h-2 w-2 rounded-full bg-current" />
    {status}
  </span>
);

export default StatusBadge;

