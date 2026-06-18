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

  if (!unique.length) return <p className="text-xs text-[#64748B] font-medium">No open risks. 🎉</p>;

  return (
    <ul className="flex max-h-[320px] flex-col gap-2.5 overflow-auto pr-1">
      {unique.map((r, i) => {
        const c = severityColor(r.severity);
        return (
          <li
            key={i}
            className="rounded-xl border border-[#E2E8F0] border-l-2 bg-white p-4 transition-all duration-200 hover:shadow-sm"
            style={{ borderLeftColor: c }}
          >
            <div className="flex items-center justify-between gap-2">
              <Badge color={c} dot>{r.severity}</Badge>
              <span className="text-[10px] font-medium text-[#94A3B8]">{timeAgo(r.detected)}</span>
            </div>
            <p className="mt-2 text-xs font-semibold text-[#0F172A]">{r.type} · {r.supplier}</p>
            <p className="mt-1 text-[11px] leading-snug text-[#64748B]">{r.description}</p>
            {onAsk && (
              <button
                onClick={() => onAsk(`Battery supply from ${r.supplier} is disrupted, suggest me another supplier`)}
                className="mt-2.5 text-[10px] font-bold text-[#0F766E] hover:text-[#047857] transition-colors"
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
  if (!news?.length) return <p className="text-xs text-[#64748B] font-medium">No live signals.</p>;
  return (
    <ul className="flex max-h-[320px] flex-col gap-2.5 overflow-auto pr-1">
      {news.map((n, i) => (
        <li key={i} className="flex gap-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4 transition-all duration-150 hover:bg-[#F1F5F9]">
          <span className="mt-0.5 text-sm">🌐</span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium leading-snug text-[#334155]">{n.text}</p>
            <span className="text-[10px] font-medium text-[#94A3B8]">{timeAgo(n.date)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Single-supplier concentration risks. */
export function MonopolyPanel({ monopolies, onAsk }) {
  if (!monopolies?.length)
    return <p className="text-xs text-[#64748B] font-medium">No single-supplier risks. Every material has a backup.</p>;
  return (
    <ul className="flex flex-col gap-2.5">
      {monopolies.map((m, i) => (
        <li key={i} className="flex items-center justify-between rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3.5 transition-all duration-150 hover:bg-[#FEE2E2]">
          <div>
            <p className="text-xs font-bold text-[#0F172A]">{m.material}</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">Only supplier: {m.supplier}</p>
          </div>
          <button
            onClick={() => onAsk?.(`What happens if ${m.supplier} fails tomorrow?`)}
            className="rounded-lg border border-[#FECACA] bg-white px-3 py-1.5 text-[10px] font-bold text-[#B91C1C] transition-all duration-150 hover:bg-[#FEF2F2] hover:border-[#FCA5A5]"
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
  if (!valid.length) return <p className="text-xs text-[#64748B] font-medium">No simulations run yet. Ask the agent: "What happens if Battery Supplies fails tomorrow?"</p>;
  return (
    <div className="flex flex-col gap-3">
      {valid.slice(0, 4).map((s, i) => (
        <div key={i} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 transition-all duration-150 hover:bg-[#F1F5F9]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F172A]">{s.supplier} fails</span>
            <span className="text-[10px] font-medium text-[#94A3B8]">{timeAgo(s.runDate)}</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Metric label="Prod. drop" value={`${s.productionDrop.toFixed(0)}%`} color="#B91C1C" />
            <Metric label="Rev. impact" value={s.revenueImpact ? formatINR(s.revenueImpact) : "—"} color="#B45309" />
            <Metric label="Alt. coverage" value={`${s.coverage.toFixed(0)}%`} color="#047857" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div className="rounded-lg bg-white border border-[#E2E8F0] py-2">
      <div className="text-sm font-bold tabular-nums" style={{ color }}>{value}</div>
      <div className="text-[10px] font-medium text-[#94A3B8] mt-0.5">{label}</div>
    </div>
  );
}
