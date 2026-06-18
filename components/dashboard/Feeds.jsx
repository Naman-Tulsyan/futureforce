"use client";
import { Badge } from "@/components/ui";
import { severityColor, timeAgo, formatINR } from "@/lib/format";

/** Active risk log feed — open items first, grouped visually by severity. */
export function RiskFeed({ risks, onAsk }) {
  const open = risks.filter((r) => !r.resolved);
  // De-duplicate identical (supplier+type+description) rows the seed data repeats.
  const seen = new Set();
  const unique = open.filter((r) => {
    const k = `${r.supplier}|${r.type}|${r.description}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  if (!unique.length) return <p className="text-xs text-slate-500">No open risks. 🎉</p>;

  return (
    <ul className="flex max-h-[320px] flex-col gap-2 overflow-auto pr-1">
      {unique.map((r, i) => {
        const c = severityColor(r.severity);
        return (
          <li
            key={i}
            className="rounded-lg border-l-2 bg-slate-800/40 p-3 transition-colors hover:bg-slate-800/70"
            style={{ borderColor: c }}
          >
            <div className="flex items-center justify-between gap-2">
              <Badge color={c} dot>{r.severity}</Badge>
              <span className="text-[10px] text-slate-500">{timeAgo(r.detected)}</span>
            </div>
            <p className="mt-1.5 text-xs font-medium text-slate-200">{r.type} · {r.supplier}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{r.description}</p>
            {onAsk && (
              <button
                onClick={() => onAsk(`Battery supply from ${r.supplier} is disrupted, suggest me another supplier`)}
                className="mt-2 text-[10px] font-medium text-cyan-400 hover:text-cyan-300"
              >
                → Find alternative
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Live external disruption signals (news). */
export function NewsFeed({ news }) {
  if (!news?.length) return <p className="text-xs text-slate-500">No live signals.</p>;
  return (
    <ul className="flex max-h-[320px] flex-col gap-2 overflow-auto pr-1">
      {news.map((n, i) => (
        <li key={i} className="flex gap-2.5 rounded-lg bg-slate-800/40 p-3">
          <span className="mt-0.5 text-sm">🌐</span>
          <div className="min-w-0">
            <p className="text-[11px] leading-snug text-slate-300">{n.text}</p>
            <span className="text-[10px] text-slate-500">{timeAgo(n.date)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Single-supplier concentration risks. */
export function MonopolyPanel({ monopolies, onAsk }) {
  if (!monopolies?.length)
    return <p className="text-xs text-slate-500">No single-supplier risks. Every material has a backup.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {monopolies.map((m, i) => (
        <li key={i} className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5">
          <div>
            <p className="text-xs font-semibold text-slate-100">{m.material}</p>
            <p className="text-[11px] text-slate-400">Only supplier: {m.supplier}</p>
          </div>
          <button
            onClick={() => onAsk?.(`What happens if ${m.supplier} fails tomorrow?`)}
            className="rounded border border-red-500/40 px-2 py-1 text-[10px] font-medium text-red-300 hover:bg-red-500/10"
          >
            Simulate failure
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Worst-case cascade simulations already run by the agent. */
export function SimulationPanel({ simulations }) {
  const valid = simulations.filter((s) => s.supplier && (s.productionDrop || s.revenueImpact || s.coverage));
  if (!valid.length) return <p className="text-xs text-slate-500">No simulations run yet. Ask the agent: “What happens if Battery Supplies fails tomorrow?”</p>;
  return (
    <div className="flex flex-col gap-2.5">
      {valid.slice(0, 4).map((s, i) => (
        <div key={i} className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-100">{s.supplier} fails</span>
            <span className="text-[10px] text-slate-500">{timeAgo(s.runDate)}</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <Metric label="Prod. drop" value={`${s.productionDrop.toFixed(0)}%`} color="#f87171" />
            <Metric label="Rev. impact" value={s.revenueImpact ? formatINR(s.revenueImpact) : "—"} color="#fbbf24" />
            <Metric label="Alt. coverage" value={`${s.coverage.toFixed(0)}%`} color="#34d399" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div className="rounded-md bg-slate-900/60 py-1.5">
      <div className="text-sm font-bold tabular-nums" style={{ color }}>{value}</div>
      <div className="text-[10px] text-slate-500">{label}</div>
    </div>
  );
}
