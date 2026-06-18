"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import AgentChat from "@/components/AgentChat";
import { Card } from "@/components/ui";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SupplierTable } from "@/components/dashboard/SupplierTable";
import { DeliveryTable } from "@/components/dashboard/DeliveryTable";
import { RiskFeed, NewsFeed, MonopolyPanel, SimulationPanel } from "@/components/dashboard/Feeds";
import { Gauge, HBars, LineChart, Donut, Heatmap } from "@/components/charts/Charts";
import { formatINR } from "@/lib/format";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [now, setNow] = useState(null);
  const chatRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else { setData(d); setError(null); }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const ask = useCallback((prompt) => {
    setChatOpen(true);
    chatRef.current?.ask(prompt);
  }, []);

  // ---- derived chart data ----------------------------------------------
  const charts = useMemo(() => {
    if (!data) return null;
    const { suppliers, deliveries, scoreHistory } = data;

    const topScores = [...suppliers]
      .sort((a, b) => b.overall - a.overall)
      .slice(0, 8)
      .map((s) => ({
        label: s.name.length > 16 ? s.name.slice(0, 15) + "…" : s.name,
        value: Number(s.overall.toFixed(1)),
        color: s.overall >= 8 ? "#34d399" : s.overall >= 6 ? "#fbbf24" : "#f87171",
      }));

    // On-time delivery trend: average rate per score-history date.
    const byDate = {};
    scoreHistory.forEach((h) => {
      if (!h.date) return;
      (byDate[h.date] ||= []).push(h.onTimeRate);
    });
    const dates = Object.keys(byDate).sort();
    const trendPoints = dates.map((d, i) => ({
      x: i,
      y: byDate[d].reduce((a, v) => a + v, 0) / byDate[d].length,
    }));

    const statusColors = { "On Track": "#34d399", Delayed: "#f87171", "At Risk": "#fbbf24", Delivered: "#60a5fa" };
    const statusCounts = {};
    deliveries.forEach((d) => { statusCounts[d.status] = (statusCounts[d.status] || 0) + 1; });
    const donut = Object.entries(statusCounts).map(([label, value]) => ({
      label, value, color: statusColors[label] || "#94a3b8",
    }));

    return { topScores, trend: trendPoints, donut };
  }, [data]);

  if (loading && !data) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
          <p className="text-sm">Connecting to Salesforce…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 p-6 text-center">
        <div className="max-w-md rounded-xl border border-red-500/30 bg-red-950/30 p-6">
          <p className="text-lg font-semibold text-red-300">Failed to load dashboard</p>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
          <button onClick={load} className="mt-4 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const k = data.kpis;
  const riskLevel = k.criticalRisks > 0 ? { label: "Elevated", color: "#f87171" } : k.atRiskDeliveries > 2 ? { label: "Watch", color: "#fbbf24" } : { label: "Stable", color: "#34d399" };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* grid backdrop glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.06),transparent_55%)]" />

      <div className={`relative transition-[margin] duration-300 ${chatOpen ? "sm:mr-[400px]" : ""}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-lg shadow-lg shadow-cyan-500/30">⚡</span>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white">Supply Chain Command Center</h1>
                <p className="text-[11px] text-slate-400">EV Manufacturing · Operations Manager View</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 sm:flex">
                <span className="h-2 w-2 rounded-full" style={{ background: riskLevel.color, boxShadow: `0 0 8px ${riskLevel.color}` }} />
                <span className="text-xs text-slate-300">System: <span style={{ color: riskLevel.color }} className="font-semibold">{riskLevel.label}</span></span>
              </div>
              <div className="hidden text-right md:block">
                <div className="font-mono text-sm tabular-nums text-slate-200">{now ? now.toLocaleTimeString() : "--:--:--"}</div>
                <div className="text-[10px] text-slate-500">Updated {new Date(data.generatedAt).toLocaleTimeString()}</div>
              </div>
              <button onClick={load} className="rounded-lg border border-slate-700 bg-slate-900/60 p-2 text-slate-400 hover:text-cyan-300" title="Refresh">
                <span className={loading ? "inline-block animate-spin" : ""}>⟳</span>
              </button>
              <button data-testid="open-chat" onClick={() => setChatOpen(true)} className="flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:bg-cyan-500">
                ⚡ Ask Agent
              </button>
            </div>
          </div>
        </header>

        <main className="space-y-5 p-5">
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="Revenue at Risk" value={formatINR(k.revenueAtRisk)} sub={`of ${formatINR(k.monthlyRevenue)}/mo`} icon="💸" tone="red" alert={k.revenueAtRisk > 0} />
            <KpiCard label="Active Disruptions" value={k.activeDisruptions} sub={`${k.criticalRisks} critical`} icon="🚨" tone="red" alert={k.criticalRisks > 0} />
            <KpiCard label="At-Risk Deliveries" value={k.atRiskDeliveries} sub={`${k.delayedDeliveries} delayed · ${k.totalDeliveries} total`} icon="📦" tone="amber" />
            <KpiCard label="Silent Suppliers" value={k.silentSuppliers} sub={k.silentSupplierNames.slice(0, 2).join(", ") || "all reporting"} icon="🔕" tone="amber" alert={k.silentSuppliers > 0} />
            <KpiCard label="Monopoly Risks" value={k.monopolyRisks} sub={k.monopolyMaterials.map((m) => m.material).slice(0, 2).join(", ") || "diversified"} icon="⚠️" tone="violet" alert={k.monopolyRisks > 0} />
            <KpiCard label="Avg On-Time" value={`${k.avgOnTime.toFixed(1)}%`} sub={`${k.activeSuppliers}/${k.totalSuppliers} active suppliers`} icon="⏱️" tone="green" />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <Card title="Risk Heatmap" subtitle="Material × Region — active suppliers & avg delivery risk" icon="🗺️" className="xl:col-span-2">
              <Heatmap regions={data.heatmap.regions} rows={data.heatmap.rows} />
            </Card>
            <Card title="Delivery Health" icon="🚦">
              <div className="flex flex-col items-center gap-4">
                <Gauge value={k.avgOnTime} label="Avg On-Time" color="#22d3ee" />
                <div className="w-full">
                  <Donut data={charts.donut} centerLabel="Deliveries" centerValue={k.totalDeliveries} />
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <Card title="Top Supplier Scores" subtitle="Overall score (0–10)" icon="🏅">
              <HBars data={charts.topScores} formatValue={(v) => v.toFixed(1)} />
            </Card>
            <Card title="On-Time Delivery Trend" subtitle="Avg rate across suppliers over time" icon="📈">
              {charts.trend.length > 1 ? (
                <LineChart series={[{ name: "On-Time %", color: "#22d3ee", points: charts.trend }]} yMax={100} formatValue={(v) => `${v.toFixed(0)}%`} />
              ) : (
                <p className="text-xs text-slate-500">Not enough history to plot a trend.</p>
              )}
            </Card>
          </div>

          {/* Tables + feeds */}
          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-3">
            <Card title="Suppliers" subtitle="Search, filter and sort the full network" icon="🏭" className="xl:col-span-2">
              <SupplierTable suppliers={data.suppliers} silentNames={k.silentSupplierNames} onAsk={ask} />
            </Card>
            <Card title="Active Risks" subtitle="Open risk log — silence & disruptions" icon="🚩">
              <RiskFeed risks={data.risks} onAsk={ask} />
            </Card>
          </div>

          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-3">
            <Card title="Active Deliveries" subtitle="Live shipment status & risk" icon="📦" className="xl:col-span-2">
              <DeliveryTable deliveries={data.deliveries} onAsk={ask} />
            </Card>
            <Card title="Live Disruption Signals" subtitle="External news affecting your regions" icon="🌐">
              <NewsFeed news={data.news} />
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <Card title="Single-Supplier Risks" subtitle="Materials with no backup source" icon="🎯">
              <MonopolyPanel monopolies={k.monopolyMaterials} onAsk={ask} />
            </Card>
            <Card title="Cascade Simulations" subtitle="What-if supplier failure impact" icon="🤯">
              <SimulationPanel simulations={data.simulations} />
            </Card>
          </div>

          <footer className="py-4 text-center text-[11px] text-slate-600">
            Live data from Salesforce · Powered by Agentforce · Supply Chain Disruption Agent
          </footer>
        </main>
      </div>

      {/* Chat drawer */}
      <AgentChat ref={chatRef} open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
