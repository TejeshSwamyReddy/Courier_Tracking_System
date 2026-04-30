const EmptyState = ({ title, copy, action }) => (
  <div className="surface flex min-h-[14rem] flex-col items-center justify-center gap-4 px-6 py-10 text-center">
    <div className="eyebrow">No data yet</div>
    <h3 className="text-xl font-semibold">{title}</h3>
    <p className="max-w-md text-sm leading-6" style={{ color: "rgb(var(--muted))" }}>
      {copy}
    </p>
    {action}
  </div>
);

export default EmptyState;

