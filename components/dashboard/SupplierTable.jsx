"use client";
import { useState, useMemo } from "react";
import { Badge, Pill } from "@/components/ui";
import { scoreBand } from "@/lib/format";

const COLUMNS = [
  { key: "name", label: "Supplier", align: "left" },
  { key: "material", label: "Material", align: "left" },
  { key: "region", label: "Region", align: "left" },
  { key: "overall", label: "Overall", align: "right" },
  { key: "financialHealth", label: "Financial", align: "right" },
  { key: "onTimeRate", label: "On-Time", align: "right" },
  { key: "costPerUnit", label: "Cost/Unit", align: "right" },
];

export function SupplierTable({ suppliers, silentNames = [], onAsk }) {
  const [sortKey, setSortKey] = useState("overall");
  const [asc, setAsc] = useState(false);
  const [material, setMaterial] = useState("All");
  const [query, setQuery] = useState("");

  const materials = useMemo(
    () => ["All", ...new Set(suppliers.map((s) => s.material).filter(Boolean))],
    [suppliers]
  );

  const rows = useMemo(() => {
    let r = suppliers.filter((s) => material === "All" || s.material === material);
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter((s) => s.name?.toLowerCase().includes(q) || s.region?.toLowerCase().includes(q));
    }
    return [...r].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const cmp = typeof av === "string" ? (av || "").localeCompare(bv || "") : (av || 0) - (bv || 0);
      return asc ? cmp : -cmp;
    });
  }, [suppliers, material, query, sortKey, asc]);

  const setSort = (k) => {
    if (k === sortKey) setAsc(!asc);
    else { setSortKey(k); setAsc(false); }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search supplier or region…"
          className="w-52 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E293B]/5 transition-all"
        />
        <div className="flex flex-wrap gap-1.5">
          {materials.map((m) => (
            <Pill key={m} active={material === m} onClick={() => setMaterial(m)}>{m}</Pill>
          ))}
        </div>
      </div>

      <div className="max-h-[360px] overflow-auto rounded-xl border border-[#E2E8F0]">
        <table className="premium-table w-full text-left text-xs">
          <thead className="sticky top-0 z-10">
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  onClick={() => setSort(c.key)}
                  className={`cursor-pointer select-none whitespace-nowrap px-4 py-3 transition-colors hover:text-[#334155] ${
                    c.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {c.label}
                  {sortKey === c.key && <span className="ml-1 text-[#0F172A] font-bold">{asc ? "▲" : "▼"}</span>}
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const band = scoreBand(s.overall);
              const silent = silentNames.includes(s.name);
              return (
                <tr key={s.name} className="group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#0F172A]">{s.name}</span>
                      {!s.active && <Badge color="#94A3B8">Inactive</Badge>}
                      {silent && <Badge color="#B45309" dot>Silent</Badge>}
                    </div>
                    <div className="text-[10px] text-[#94A3B8] mt-0.5">{s.location}</div>
                  </td>
                  <td className="px-4 py-3 text-[#475569]">{s.material}</td>
                  <td className="px-4 py-3 text-[#475569]">{s.region}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="rounded-md px-2 py-0.5 font-bold tabular-nums text-sm"
                      style={{ color: band.color, background: band.bg }}>
                      {s.overall.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#475569]">{s.financialHealth.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span style={{ color: s.onTimeRate >= 90 ? "#047857" : s.onTimeRate >= 80 ? "#B45309" : "#B91C1C" }}>
                      {s.onTimeRate.toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#64748B]">₹{s.costPerUnit.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onAsk?.(`Give me a full health check on ${s.name}`)}
                      className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-semibold text-[#64748B] opacity-0 transition-all duration-150 hover:border-[#CBD5E1] hover:text-[#0F172A] hover:bg-[#F1F5F9] group-hover:opacity-100"
                    >
                      Ask agent
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] font-medium text-[#94A3B8]">{rows.length} of {suppliers.length} suppliers</p>
    </div>
  );
}
