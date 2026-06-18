"use client";

/** Standard card container — enterprise dashboard style */
export function Card({ title, subtitle, icon, action, className = "", bodyClassName = "", children }) {
  return (
    <section
      className={`rounded-xl border border-[#E2E8F0] bg-white shadow-sm transition-all duration-200 hover:shadow-md ${className}`}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-[#F1F5F9] px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F8FAFC] text-base leading-none ring-1 ring-[#E2E8F0]">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-[13px] font-semibold text-[#0F172A]">{title}</h2>
              {subtitle && <p className="truncate text-[11px] text-[#94A3B8] mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action}
        </header>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

export function Badge({ color = "#64748B", children, dot = false }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ color, background: `${color}10`, border: `1px solid ${color}20` }}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full animate-[breathe_2s_ease-in-out_infinite]" style={{ background: color }} />}
      {children}
    </span>
  );
}

export function Pill({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all duration-150 ${
        active
          ? "bg-[#1E293B] text-white shadow-sm"
          : "bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] hover:bg-[#F1F5F9] hover:text-[#334155] hover:border-[#CBD5E1]"
      }`}
    >
      {children}
    </button>
  );
}
