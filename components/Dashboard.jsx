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

  const charts = useMemo(() => {
    if (!data) return null;
    const { suppliers, deliveries, scoreHistory } = data;
    const topScores = [...suppliers].sort((a, b) => b.overall - a.overall).slice(0, 8)
      .map((s) => ({ label: s.name.length > 16 ? s.name.slice(0, 15) + "…" : s.name, value: Number(s.overall.toFixed(1)), color: s.overall >= 8 ? "#047857" : s.overall >= 6 ? "#B45309" : "#B91C1C" }));
    const byDate = {};
    scoreHistory.forEach((h) => { if (!h.date) return; (byDate[h.date] ||= []).push(h.onTimeRate); });
    const dates = Object.keys(byDate).sort();
    const trendPoints = dates.map((d, i) => ({ x: i, y: byDate[d].reduce((a, v) => a + v, 0) / byDate[d].length }));
    const statusColors = { "On Track": "#047857", Delayed: "#B91C1C", "At Risk": "#B45309", Delivered: "#1E293B" };
    const statusCounts = {};
    deliveries.forEach((d) => { statusCounts[d.status] = (statusCounts[d.status] || 0) + 1; });
    const donut = Object.entries(statusCounts).map(([label, value]) => ({ label, value, color: statusColors[label] || "#94A3B8" }));
    return { topScores, trend: trendPoints, donut };
  }, [data]);

  if (loading && !data) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#1E293B]" />
          <p className="text-sm font-medium text-[#64748B]">Connecting to Salesforce…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F8FAFC] p-6 text-center">
        <div className="max-w-md rounded-xl border border-[#FECACA] bg-white p-8 shadow-sm">
          <p className="text-lg font-bold text-[#0F172A]">Connection Failed</p>
          <p className="mt-2 text-sm text-[#64748B]">{error}</p>
          <button onClick={load} className="mt-6 rounded-lg bg-[#1E293B] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0F172A]">Retry</button>
        </div>
      </div>
    );
  }

  const k = data.kpis;
  const riskLevel = k.criticalRisks > 0 ? { label: "Elevated", color: "#B91C1C" } : k.atRiskDeliveries > 2 ? { label: "Watch", color: "#B45309" } : { label: "Stable", color: "#047857" };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <div className={`relative transition-[margin] duration-300 ${chatOpen ? "sm:mr-[440px]" : ""}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-sm shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E293B] text-lg text-white shadow-sm">⚡</span>
              <div>
                <h1 className="text-[15px] font-bold tracking-tight text-[#0F172A]">Supply Chain Command Center</h1>
                <p className="text-[11px] font-medium text-[#94A3B8]">EV Manufacturing · Operations Manager View</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 sm:flex">
                <span className="h-2 w-2 rounded-full" style={{ background: riskLevel.color }} />
                <span className="text-xs font-medium text-[#64748B]">System: <span style={{ color: riskLevel.color }} className="font-bold">{riskLevel.label}</span></span>
              </div>
              <div className="hidden text-right md:block">
                <div className="font-mono text-sm font-semibold tabular-nums text-[#0F172A]">{now ? now.toLocaleTimeString() : "--:--:--"}</div>
                <div className="text-[10px] font-medium text-[#94A3B8]">Updated {new Date(data.generatedAt).toLocaleTimeString()}</div>
              </div>
              <button onClick={load} className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-[#64748B] transition-all duration-150 hover:bg-[#F1F5F9] hover:text-[#0F172A] hover:border-[#CBD5E1]" title="Refresh">
                <span className={loading ? "inline-block animate-spin" : ""}>⟳</span>
              </button>
              <button data-testid="open-chat" onClick={() => setChatOpen(true)} className="flex items-center gap-2 rounded-lg bg-[#1E293B] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-[#0F172A]">⚡ Ask Agent</button>
            </div>
          </div>
        </header>

        <main className="space-y-6 p-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="Revenue at Risk" value={formatINR(k.revenueAtRisk)} sub={`of ${formatINR(k.monthlyRevenue)}/mo`} icon="💸" tone="red" alert={k.revenueAtRisk > 0} />
            <KpiCard label="Active Disruptions" value={k.activeDisruptions} sub={`${k.criticalRisks} critical`} icon="🚨" tone="red" alert={k.criticalRisks > 0} />
            <KpiCard label="At-Risk Deliveries" value={k.atRiskDeliveries} sub={`${k.delayedDeliveries} delayed · ${k.totalDeliveries} total`} icon="📦" tone="amber" />
            <KpiCard label="Silent Suppliers" value={k.silentSuppliers} sub={k.silentSupplierNames.slice(0, 2).join(", ") || "all reporting"} icon="🔕" tone="amber" alert={k.silentSuppliers > 0} />
            <KpiCard label="Monopoly Risks" value={k.monopolyRisks} sub={k.monopolyMaterials.map((m) => m.material).slice(0, 2).join(", ") || "diversified"} icon="⚠️" tone="violet" alert={k.monopolyRisks > 0} />
            <KpiCard label="Avg On-Time" value={`${k.avgOnTime.toFixed(1)}%`} sub={`${k.activeSuppliers}/${k.totalSuppliers} active suppliers`} icon="⏱️" tone="green" />
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card title="Risk Heatmap" subtitle="Material × Region — active suppliers & avg delivery risk" icon="🗺️" className="xl:col-span-2"><Heatmap regions={data.heatmap.regions} rows={data.heatmap.rows} /></Card>
            <Card title="Delivery Health" icon="🚦"><div className="flex flex-col items-center gap-5"><Gauge value={k.avgOnTime} label="Avg On-Time" color="#047857" /><div className="w-full"><Donut data={charts.donut} centerLabel="Deliveries" centerValue={k.totalDeliveries} /></div></div></Card>
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card title="Top Supplier Scores" subtitle="Overall score (0–10)" icon="🏅"><HBars data={charts.topScores} formatValue={(v) => v.toFixed(1)} /></Card>
            <Card title="On-Time Delivery Trend" subtitle="Avg rate across suppliers over time" icon="📈">
              {charts.trend.length > 1 ? <LineChart series={[{ name: "On-Time %", color: "#047857", points: charts.trend }]} yMax={100} formatValue={(v) => `${v.toFixed(0)}%`} /> : <p className="text-xs text-[#94A3B8]">Not enough history to plot a trend.</p>}
            </Card>
          </div>
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
            <Card title="Suppliers" subtitle="Search, filter and sort the full network" icon="🏭" className="xl:col-span-2"><SupplierTable suppliers={data.suppliers} silentNames={k.silentSupplierNames} onAsk={ask} /></Card>
            <Card title="Active Risks" subtitle="Open risk log — silence & disruptions" icon="🚩"><RiskFeed risks={data.risks} onAsk={ask} /></Card>
          </div>
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
            <Card title="Active Deliveries" subtitle="Live shipment status & risk" icon="📦" className="xl:col-span-2"><DeliveryTable deliveries={data.deliveries} onAsk={ask} /></Card>
            <Card title="Live Disruption Signals" subtitle="External news affecting your regions" icon="🌐"><NewsFeed news={data.news} /></Card>
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card title="Single-Supplier Risks" subtitle="Materials with no backup source" icon="🎯"><MonopolyPanel monopolies={k.monopolyMaterials} onAsk={ask} /></Card>
            <Card title="Cascade Simulations" subtitle="What-if supplier failure impact" icon="🤯"><SimulationPanel simulations={data.simulations} /></Card>
          </div>
          <footer className="py-6 text-center">
            <div className="mx-auto h-px w-24 bg-[#E2E8F0] mb-4" />
            <p className="text-[11px] font-medium text-[#94A3B8]">Live data from Salesforce · Powered by Agentforce · Supply Chain Disruption Agent</p>
          </footer>
        </main>
      </div>
      <AgentChat ref={chatRef} open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
