"use client";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui";
import { riskColor, formatNum } from "@/lib/format";

const STATUS_COLORS = {
  "On Track": "#047857",
  Delayed: "#B91C1C",
  "At Risk": "#B45309",
  Delivered: "#1E293B",
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
      <div className="mb-4 flex flex-wrap gap-1.5">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-all duration-150 ${
              filter === s
                ? "bg-[#1E293B] text-white shadow-sm"
                : "bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] hover:bg-[#F1F5F9] hover:text-[#334155]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="max-h-[360px] overflow-auto rounded-xl border border-[#E2E8F0]">
        <table className="premium-table w-full text-left text-xs">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3">Delivery</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Material</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3">ETA</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Risk</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.name} className="group">
                <td className="px-4 py-3 font-semibold text-[#0F172A]">{d.name}</td>
                <td className="px-4 py-3 text-[#475569]">{d.supplier}</td>
                <td className="px-4 py-3 text-[#64748B]">{d.material}</td>
                <td className="px-4 py-3 text-right tabular-nums text-[#475569]">{formatNum(d.quantity)}</td>
                <td className="px-4 py-3 text-[#475569]">
                  {d.eta}
                  {d.delayDays > 0 && <span className="ml-1 font-semibold text-[#B91C1C]">+{d.delayDays}d</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge color={STATUS_COLORS[d.status] || "#94A3B8"} dot>{d.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-14 overflow-hidden rounded-full bg-[#F1F5F9]">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${d.risk * 10}%`, background: riskColor(d.risk) }} />
                    </div>
                    <span className="w-6 text-right tabular-nums font-bold text-sm" style={{ color: riskColor(d.risk) }}>
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
