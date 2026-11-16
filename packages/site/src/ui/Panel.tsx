import { twMerge } from "tailwind-merge";

export function Panel({
  title,
  actions,
  className,
  children,
  ref,
}: {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  ref?: React.Ref<HTMLElement>;
}) {
  return (
    <section
      ref={ref}
      className={twMerge(
        "flex min-w-0 flex-col rounded border border-line bg-panel",
        className,
      )}
    >
      {(title != null || actions != null) && (
        <header className="flex items-center gap-2 border-b border-line px-3 py-1 text-xs text-muted">
          <span className="font-mono">{title}</span>
          {actions && <div className="flex gap-1">{actions}</div>}
        </header>
      )}
      <div className="overflow-auto p-3">{children}</div>
    </section>
  );
}
