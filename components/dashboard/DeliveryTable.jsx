"use client";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui";
import { riskColor, formatNum } from "@/lib/format";

const STATUS_COLORS = {
  "On Track": "#34d399",
  Delayed: "#f87171",
  "At Risk": "#fbbf24",
  Delivered: "#60a5fa",
};

export function DeliveryTable({ deliveries, onAsk }) {
  const [filter, setFilter] = useState("All");

  const statuses = useMemo(
    () => ["All", ...new Set(deliveries.map((d) => d.status).filter(Boolean))],
    [deliveries]
  );
  const rows = useMemo(
    () => deliveries.filter((d) => filter === "All" || d.status === filter),
    [deliveries, filter]
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === s
                ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
                : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="max-h-[360px] overflow-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 z-10 bg-slate-900 text-slate-400">
            <tr>
              <th className="px-3 py-2 font-medium">Delivery</th>
              <th className="px-3 py-2 font-medium">Supplier</th>
              <th className="px-3 py-2 font-medium">Material</th>
              <th className="px-3 py-2 text-right font-medium">Qty</th>
              <th className="px-3 py-2 font-medium">ETA</th>
              <th className="px-3 py-2 text-center font-medium">Status</th>
              <th className="px-3 py-2 text-right font-medium">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((d) => (
              <tr key={d.name} className="hover:bg-slate-800/40">
                <td className="px-3 py-2 font-medium text-slate-100">{d.name}</td>
                <td className="px-3 py-2 text-slate-300">{d.supplier}</td>
                <td className="px-3 py-2 text-slate-400">{d.material}</td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-300">{formatNum(d.quantity)}</td>
                <td className="px-3 py-2 text-slate-400">
                  {d.eta}
                  {d.delayDays > 0 && <span className="ml-1 text-red-400">+{d.delayDays}d</span>}
                </td>
                <td className="px-3 py-2 text-center">
                  <Badge color={STATUS_COLORS[d.status] || "#94a3b8"} dot>{d.status}</Badge>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full" style={{ width: `${d.risk * 10}%`, background: riskColor(d.risk) }} />
                    </div>
                    <span className="w-6 text-right tabular-nums font-semibold" style={{ color: riskColor(d.risk) }}>
                      {d.risk.toFixed(1)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
