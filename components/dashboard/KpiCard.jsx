"use client";

/**
 * Top-row metric card. `tone` drives the accent color; `alert` adds a subtle
 * pulse to draw the manager's eye to active problems.
 */
export function KpiCard({ label, value, sub, icon, tone = "cyan", alert = false }) {
  const tones = {
    cyan: { ring: "ring-cyan-500/30", text: "text-cyan-300", glow: "shadow-cyan-500/10", bar: "bg-cyan-400" },
    red: { ring: "ring-red-500/30", text: "text-red-400", glow: "shadow-red-500/10", bar: "bg-red-400" },
    amber: { ring: "ring-amber-500/30", text: "text-amber-300", glow: "shadow-amber-500/10", bar: "bg-amber-400" },
    green: { ring: "ring-emerald-500/30", text: "text-emerald-300", glow: "shadow-emerald-500/10", bar: "bg-emerald-400" },
    violet: { ring: "ring-violet-500/30", text: "text-violet-300", glow: "shadow-violet-500/10", bar: "bg-violet-400" },
  };
  const t = tones[tone] || tones.cyan;
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-4 ring-1 ${t.ring} shadow-lg ${t.glow} ${
        alert ? "animate-[pulseGlow_2.5s_ease-in-out_infinite]" : ""
      }`}
    >
      <span className={`absolute left-0 top-0 h-full w-1 ${t.bar}`} />
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</span>
        <span className="text-lg leading-none opacity-80">{icon}</span>
      </div>
      <div className={`mt-2 text-2xl font-bold tabular-nums ${t.text}`}>{value}</div>
      {sub && <div className="mt-1 text-[11px] text-slate-400">{sub}</div>}
    </div>
  );
}
