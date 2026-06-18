"use client";

/** Standard dark panel container used across the dashboard. */
export function Card({ title, subtitle, icon, action, className = "", bodyClassName = "", children }) {
  return (
    <section
      className={`rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm shadow-lg shadow-black/20 ${className}`}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            {icon && <span className="text-base leading-none">{icon}</span>}
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-slate-100">{title}</h2>
              {subtitle && <p className="truncate text-[11px] text-slate-400">{subtitle}</p>}
            </div>
          </div>
          {action}
        </header>
      )}
      <div className={`p-4 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

export function Badge({ color = "#94a3b8", children, dot = false }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ color, background: `${color}1f` }}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />}
      {children}
    </span>
  );
}

export function Pill({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
          : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
