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
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search supplier or region…"
          className="w-48 rounded-md border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
        />
        <div className="flex flex-wrap gap-1.5">
          {materials.map((m) => (
            <Pill key={m} active={material === m} onClick={() => setMaterial(m)}>{m}</Pill>
          ))}
        </div>
      </div>

      <div className="max-h-[360px] overflow-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 z-10 bg-slate-900">
            <tr className="text-slate-400">
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  onClick={() => setSort(c.key)}
                  className={`cursor-pointer select-none whitespace-nowrap px-3 py-2 font-medium hover:text-slate-200 ${
                    c.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {c.label}
                  {sortKey === c.key && <span className="ml-1 text-cyan-400">{asc ? "▲" : "▼"}</span>}
                </th>
              ))}
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((s) => {
              const band = scoreBand(s.overall);
              const silent = silentNames.includes(s.name);
              return (
                <tr key={s.name} className="group hover:bg-slate-800/40">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-100">{s.name}</span>
                      {!s.active && <Badge color="#94a3b8">Inactive</Badge>}
                      {silent && <Badge color="#fb923c" dot>Silent</Badge>}
                    </div>
                    <div className="text-[10px] text-slate-500">{s.location}</div>
                  </td>
                  <td className="px-3 py-2 text-slate-300">{s.material}</td>
                  <td className="px-3 py-2 text-slate-300">{s.region}</td>
                  <td className="px-3 py-2 text-right">
                    <span className="rounded px-1.5 py-0.5 font-semibold tabular-nums"
                      style={{ color: band.color, background: band.bg }}>
                      {s.overall.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-300">{s.financialHealth.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    <span style={{ color: s.onTimeRate >= 90 ? "#34d399" : s.onTimeRate >= 80 ? "#fbbf24" : "#f87171" }}>
                      {s.onTimeRate.toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-400">₹{s.costPerUnit.toLocaleString("en-IN")}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => onAsk?.(`Give me a full health check on ${s.name}`)}
                      className="rounded border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400 opacity-0 transition-opacity hover:border-cyan-500 hover:text-cyan-300 group-hover:opacity-100"
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
      <p className="mt-2 text-[11px] text-slate-500">{rows.length} of {suppliers.length} suppliers</p>
    </div>
  );
}
