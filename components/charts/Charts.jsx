"use client";
// Lightweight dependency-free SVG charts — enterprise light theme.

/* ----------------------------- Gauge ----------------------------------- */
export function Gauge({ value, max = 100, label, suffix = "%", color = "#047857", size = 140 }) {
  const pct = Math.max(0, Math.min(1, value / max));
  const r = size / 2 - 14;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * 0.75; // 270° arc
  const offset = dash * (1 - pct);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-[135deg]">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-[#0F172A] tabular-nums">
          {Number(value).toFixed(value % 1 ? 1 : 0)}{suffix}
        </span>
        {label && <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">{label}</span>}
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
            <rect x={x} y={y} width={barW} height={Math.max(h, 0.5)} rx="2"
              fill={d.color || barColor || "#1E293B"}>
              <title>{`${d.label}: ${formatValue(d.value)}`}</title>
            </rect>
          </g>
        );
      })}
    </svg>
  );
}

/** Labeled horizontal bars — better for long category names + values. */
export function HBars({ data, formatValue = (v) => v, accent = "#1E293B" }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex flex-col gap-3">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3 text-xs">
          <span className="w-28 shrink-0 truncate font-medium text-[#475569]" title={d.label}>{d.label}</span>
          <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-[#F1F5F9]">
            <div className="h-full rounded-md transition-all duration-700"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color || accent, opacity: 0.85 }} />
          </div>
          <span className="w-12 shrink-0 text-right font-bold tabular-nums text-[#0F172A]">
            {formatValue(d.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* --------------------------- Line chart -------------------------------- */
export function LineChart({ series, height = 220, yMax, formatValue = (v) => v }) {
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
        <defs>
          {series.map((s, si) => (
            <linearGradient key={si} id={`areaGrad${si}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.12" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.01" />
            </linearGradient>
          ))}
        </defs>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1={pad} x2={W - pad} y1={H - pad - g * (H - pad * 2)}
            y2={H - pad - g * (H - pad * 2)} stroke="#E2E8F0" strokeWidth="0.3" />
        ))}
        {series.map((s, si) => {
          const path = s.points.map((p, i) => `${i === 0 ? "M" : "L"} ${sx(p.x)} ${sy(p.y)}`).join(" ");
          const lastPt = s.points[s.points.length - 1];
          const firstPt = s.points[0];
          const areaPath = `${path} L ${sx(lastPt.x)} ${H - pad} L ${sx(firstPt.x)} ${H - pad} Z`;
          return (
            <g key={si}>
              <path d={areaPath} fill={`url(#areaGrad${si})`} />
              <path d={path} fill="none" stroke={s.color} strokeWidth="0.8"
                strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              {s.points.map((p, i) => (
                <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r="1" fill="white" stroke={s.color} strokeWidth="0.5">
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
    <div className="flex items-center gap-5">
      <svg width={size} height={size} className="-rotate-90">
        {data.map((d, i) => {
          const frac = d.value / total;
          const dash = frac * c;
          const seg = (
            <circle key={i} cx={center} cy={center} r={r} fill="none" stroke={d.color}
              strokeWidth={thickness} strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-acc * c} strokeLinecap="round" />
          );
          acc += frac;
          return seg;
        })}
      </svg>
      <div className="flex flex-col gap-2">
        {centerValue != null && (
          <div className="mb-1">
            <div className="text-xl font-bold text-[#0F172A]">{centerValue}</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">{centerLabel}</div>
          </div>
        )}
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2.5 text-xs text-[#475569]">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
            <span className="flex-1">{d.label}</span>
            <span className="font-bold tabular-nums text-[#0F172A]">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------- Heatmap ---------------------------------- */
export function Heatmap({ regions, rows }) {
  const cellColor = (cell) => {
    if (!cell.suppliers) return "#F8FAFC";
    const r = cell.avgRisk ?? 0;
    if (r >= 7) return "#FEE2E2";
    if (r >= 4) return "#FEF3C7";
    if (r > 0) return "#D1FAE5";
    return "#ECFDF5";
  };
  const cellText = (cell) => {
    if (!cell.suppliers) return "#CBD5E1";
    const r = cell.avgRisk ?? 0;
    if (r >= 7) return "#991B1B";
    if (r >= 4) return "#92400E";
    if (r > 0) return "#065F46";
    return "#047857";
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate" style={{ borderSpacing: 4 }}>
        <thead>
          <tr>
            <th className="sticky left-0 bg-transparent" />
            {regions.map((r) => (
              <th key={r} className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#94A3B8]">
                {r}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.material}>
              <td className="whitespace-nowrap pr-3 text-right text-[11px] font-semibold text-[#475569]">
                {row.material}
              </td>
              {row.cells.map((cell) => (
                <td key={cell.region} className="p-0">
                  <div
                    className="flex h-10 min-w-[44px] items-center justify-center rounded-lg text-[11px] font-bold transition-transform duration-150 hover:scale-105"
                    style={{ background: cellColor(cell), color: cellText(cell) }}
                    title={
                      cell.suppliers
                        ? `${row.material} · ${cell.region}: ${cell.suppliers} supplier(s), avg risk ${(cell.avgRisk ?? 0).toFixed(1)}`
                        : `${row.material} · ${cell.region}: no supplier`
                    }
                  >
                    {cell.suppliers || "—"}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex items-center gap-5 text-[11px] font-medium text-[#64748B]">
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded" style={{ background: "#D1FAE5" }} /> Low risk</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded" style={{ background: "#FEF3C7" }} /> Medium</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded" style={{ background: "#FEE2E2" }} /> High</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded border border-[#E2E8F0]" style={{ background: "#F8FAFC" }} /> No supplier</span>
        <span className="ml-auto text-[#94A3B8]">Number = active suppliers</span>
      </div>
    </div>
  );
}
