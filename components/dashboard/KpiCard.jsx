"use client";

/**
 * Top-row metric card. `tone` drives the accent color; `alert` adds a subtle
 * pulse to draw the manager's eye to active problems.
 */
export function KpiCard({ label, value, sub, icon, tone = "green", alert = false }) {
  const tones = {
    green:  { accent: "#047857", bg: "#FFFFFF", border: "#E2E8F0", bar: "#047857", iconBg: "#ECFDF5", iconBorder: "#A7F3D0" },
    red:    { accent: "#B91C1C", bg: "#FFFFFF", border: "#E2E8F0", bar: "#B91C1C", iconBg: "#FEF2F2", iconBorder: "#FECACA" },
    amber:  { accent: "#B45309", bg: "#FFFFFF", border: "#E2E8F0", bar: "#B45309", iconBg: "#FFFBEB", iconBorder: "#FDE68A" },
    violet: { accent: "#0F766E", bg: "#FFFFFF", border: "#E2E8F0", bar: "#0F766E", iconBg: "#F0FDFA", iconBorder: "#99F6E4" },
    cyan:   { accent: "#0F766E", bg: "#FFFFFF", border: "#E2E8F0", bar: "#0F766E", iconBg: "#F0FDFA", iconBorder: "#99F6E4" },
  };
  const t = tones[tone] || tones.green;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md ${
        alert ? "animate-[pulseGlow_2.5s_ease-in-out_infinite]" : ""
      }`}
      style={{ borderColor: t.border }}
    >
      {/* Left accent bar */}
      <span className="absolute left-0 top-0 h-full w-1 rounded-l-xl" style={{ background: t.bar }} />

      <div className="flex items-start justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">{label}</span>
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg text-sm leading-none ring-1"
          style={{ background: t.iconBg, ringColor: t.iconBorder }}
        >
          {icon}
        </span>
      </div>
      <div className="mt-2.5 text-2xl font-bold tabular-nums tracking-tight" style={{ color: t.accent }}>
        {value}
      </div>
      {sub && <div className="mt-1.5 text-[11px] text-[#94A3B8] leading-snug">{sub}</div>}
    </div>
  );
}
