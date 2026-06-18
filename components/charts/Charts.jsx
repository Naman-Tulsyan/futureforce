"use client";
// Lightweight dependency-free SVG charts tuned for the dark command-center theme.

/* ----------------------------- Gauge ----------------------------------- */
export function Gauge({ value, max = 100, label, suffix = "%", color = "#22d3ee", size = 130 }) {
  const pct = Math.max(0, Math.min(1, value / max));
  const r = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * 0.75; // 270° arc
  const offset = dash * (1 - pct);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-[135deg]">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white tabular-nums">
          {Number(value).toFixed(value % 1 ? 1 : 0)}{suffix}
        </span>
        {label && <span className="text-[11px] uppercase tracking-wide text-slate-400">{label}</span>}
      </div>
    </div>
  );
}

/* --------------------------- Bar chart --------------------------------- */
export function BarChart({ data, height = 200, barColor, formatValue = (v) => v }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barW = 100 / (data.length * 1.6);
  const gap = barW * 0.6;
  return (
    <svg viewBox={`0 0 100 ${height / 3}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.value / max) * (height / 3 - 10);
        const x = i * (barW + gap) + gap;
        const y = height / 3 - h - 6;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={Math.max(h, 0.5)} rx="1.2"
              fill={d.color || barColor || "#22d3ee"}>
              <title>{`${d.label}: ${formatValue(d.value)}`}</title>
            </rect>
          </g>
        );
      })}
    </svg>
  );
}

/** Labeled horizontal bars — better for long category names + values. */
export function HBars({ data, formatValue = (v) => v, accent = "#22d3ee" }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3 text-xs">
          <span className="w-28 shrink-0 truncate text-slate-300" title={d.label}>{d.label}</span>
          <div className="relative h-5 flex-1 overflow-hidden rounded bg-slate-800/60">
            <div className="h-full rounded transition-all duration-700"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color || accent }} />
          </div>
          <span className="w-20 shrink-0 text-right font-semibold tabular-nums text-slate-200">
            {formatValue(d.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* --------------------------- Line chart -------------------------------- */
export function LineChart({ series, height = 220, yMax, formatValue = (v) => v }) {
  // series: [{ name, color, points: [{x, y}] }]  — x as index, y numeric
  const allY = series.flatMap((s) => s.points.map((p) => p.y));
  const maxY = yMax ?? Math.max(...allY, 1);
  const minY = Math.min(...allY, 0);
  const maxX = Math.max(...series.flatMap((s) => s.points.map((p) => p.x)), 1);
  const W = 100;
  const H = 100;
  const pad = 4;
  const sx = (x) => pad + (x / maxX) * (W - pad * 2);
  const sy = (y) => H - pad - ((y - minY) / (maxY - minY || 1)) * (H - pad * 2);

  return (
    <div style={{ height }} className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full">
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1={pad} x2={W - pad} y1={H - pad - g * (H - pad * 2)}
            y2={H - pad - g * (H - pad * 2)} stroke="#1e293b" strokeWidth="0.3" />
        ))}
        {series.map((s, si) => {
          const path = s.points
            .map((p, i) => `${i === 0 ? "M" : "L"} ${sx(p.x)} ${sy(p.y)}`)
            .join(" ");
          return (
            <g key={si}>
              <path d={path} fill="none" stroke={s.color} strokeWidth="0.8"
                strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              {s.points.map((p, i) => (
                <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r="0.9" fill={s.color}>
                  <title>{`${s.name} — ${formatValue(p.y)}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ----------------------------- Donut ----------------------------------- */
export function Donut({ data, size = 150, thickness = 18, centerLabel, centerValue }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const r = size / 2 - thickness / 2;
  const center = size / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="-rotate-90">
        {data.map((d, i) => {
          const frac = d.value / total;
          const dash = frac * c;
          const seg = (
            <circle key={i} cx={center} cy={center} r={r} fill="none" stroke={d.color}
              strokeWidth={thickness} strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-acc * c} />
          );
          acc += frac;
          return seg;
        })}
      </svg>
      <div className="flex flex-col gap-1.5">
        {centerValue != null && (
          <div className="mb-1">
            <div className="text-xl font-bold text-white">{centerValue}</div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400">{centerLabel}</div>
          </div>
        )}
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
            <span className="flex-1">{d.label}</span>
            <span className="font-semibold tabular-nums text-slate-100">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------- Heatmap ---------------------------------- */
export function Heatmap({ regions, rows }) {
  // rows: [{ material, cells: [{ region, suppliers, avgRisk }] }]
  const cellColor = (cell) => {
    if (!cell.suppliers) return "rgba(30,41,59,0.5)"; // empty — no supplier
    const r = cell.avgRisk ?? 0;
    if (r >= 7) return "rgba(248,113,113,0.85)";
    if (r >= 4) return "rgba(251,191,36,0.8)";
    if (r > 0) return "rgba(52,211,153,0.75)";
    return "rgba(52,211,153,0.4)";
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate" style={{ borderSpacing: 3 }}>
        <thead>
          <tr>
            <th className="sticky left-0 bg-transparent" />
            {regions.map((r) => (
              <th key={r} className="px-1 pb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                {r}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.material}>
              <td className="whitespace-nowrap pr-2 text-right text-[11px] font-medium text-slate-300">
                {row.material}
              </td>
              {row.cells.map((cell) => (
                <td key={cell.region} className="p-0">
                  <div
                    className="flex h-9 min-w-[42px] items-center justify-center rounded text-[11px] font-bold text-slate-900"
                    style={{ background: cellColor(cell) }}
                    title={
                      cell.suppliers
                        ? `${row.material} · ${cell.region}: ${cell.suppliers} supplier(s), avg risk ${(cell.avgRisk ?? 0).toFixed(1)}`
                        : `${row.material} · ${cell.region}: no supplier`
                    }
                  >
                    {cell.suppliers || ""}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded" style={{ background: "rgba(52,211,153,0.75)" }} /> Low risk</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded" style={{ background: "rgba(251,191,36,0.8)" }} /> Medium</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded" style={{ background: "rgba(248,113,113,0.85)" }} /> High</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded" style={{ background: "rgba(30,41,59,0.5)" }} /> No supplier</span>
        <span className="ml-auto">Number = active suppliers</span>
      </div>
    </div>
  );
}
