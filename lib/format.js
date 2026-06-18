// Shared formatting helpers (safe to import on the client).

/** Format an INR amount using Indian Crore / Lakh abbreviations. */
export function formatINR(value, { decimals = 2 } = {}) {
  const n = Number(value) || 0;
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(decimals)} Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(decimals)} L`;
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)} K`;
  return `${sign}₹${abs.toFixed(0)}`;
}

/** Compact number formatting (1.2K, 3.4M). */
export function formatNum(value) {
  const n = Number(value) || 0;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${n}`;
}

/** Human "x days/hours ago" from an ISO timestamp. */
export function timeAgo(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  return `${months}mo ago`;
}

/** Map a 0-10 score to a semantic color band. */
export function scoreBand(score) {
  if (score >= 8) return { color: "#047857", label: "Strong", bg: "#ECFDF5" };
  if (score >= 6) return { color: "#B45309", label: "Watch", bg: "#FFFBEB" };
  return { color: "#B91C1C", label: "At Risk", bg: "#FEF2F2" };
}

/** Map a 0-10 risk score (higher = worse) to a color. */
export function riskColor(risk) {
  if (risk >= 7) return "#B91C1C";
  if (risk >= 4) return "#B45309";
  return "#047857";
}

export function severityColor(severity = "") {
  switch (severity.toLowerCase()) {
    case "critical":
      return "#B91C1C";
    case "high":
      return "#C2410C";
    case "medium":
      return "#B45309";
    case "low":
      return "#0F766E";
    default:
      return "#64748B";
  }
}
