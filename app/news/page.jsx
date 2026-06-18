"use client";
import { useState } from "react";

const RELATED = [
  {
    tag: "Logistics",
    title: "JNPT terminals report container backlog as labour talks stall",
    time: "18m ago",
  },
  {
    tag: "Markets",
    title: "Electronics importers warn of festive-season stock crunch",
    time: "42m ago",
  },
  {
    tag: "Policy",
    title: "Commerce Ministry calls emergency meeting with port unions",
    time: "1h ago",
  },
  {
    tag: "Auto",
    title: "EV makers flag semiconductor exposure to western-coast ports",
    time: "2h ago",
  },
];

export default function NewsPage() {
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState("");

  const sendAlert = async () => {
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/slack/alert", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
      setStatus("sent");
    } catch (e) {
      setStatus("error");
      setErrorMsg(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-white font-serif text-neutral-900">
      {/* Breaking ticker */}
      <div className="flex items-center gap-3 overflow-hidden bg-red-700 px-4 py-1.5 text-white">
        <span className="shrink-0 rounded bg-white px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-red-700">
          Breaking
        </span>
        <p className="truncate text-sm font-medium">
          Mumbai Port customs workers go on indefinite strike · West-coast cargo movement grinds to a halt
        </p>
      </div>

      {/* Masthead */}
      <header className="border-b-2 border-neutral-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="text-[11px] text-neutral-500">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <h1 className="text-center text-3xl font-black tracking-tight">
            BHARAT BUSINESS WIRE
          </h1>
          <div className="text-right text-[11px] text-neutral-500">
            Trade &amp; Logistics Desk
          </div>
        </div>
        <nav className="border-t border-neutral-200">
          <div className="mx-auto flex max-w-5xl gap-5 px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-neutral-600">
            {["Home", "Economy", "Markets", "Logistics", "Auto", "Policy", "World"].map(
              (n) => (
                <span key={n} className={n === "Logistics" ? "text-red-700" : ""}>
                  {n}
                </span>
              )
            )}
          </div>
        </nav>
      </header>

      {/* Article */}
      <main className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-4 py-8 lg:grid-cols-3">
        <article className="lg:col-span-2">
          <p className="text-[12px] font-bold uppercase tracking-widest text-red-700">
            Logistics · Breaking
          </p>
          <h2 className="mt-2 text-4xl font-black leading-tight">
            Mumbai Port Customs Workers Go On Indefinite Strike
          </h2>
          <p className="mt-3 text-lg leading-relaxed text-neutral-700">
            Customs clearance at one of India's busiest gateways has come to a
            standstill as thousands of workers walk off the job, stranding
            high-value electronics and auto-component cargo.
          </p>

          <div className="mt-4 flex items-center gap-3 border-y border-neutral-200 py-2 text-[12px] text-neutral-500">
            <span className="font-semibold text-neutral-700">By Trade Desk</span>
            <span>·</span>
            <span>Mumbai</span>
            <span>·</span>
            <span>Updated just now</span>
          </div>

          <div className="mt-5 h-56 w-full rounded bg-gradient-to-br from-neutral-200 to-neutral-300" />
          <p className="mt-1 text-[11px] italic text-neutral-500">
            Containers pile up at the Mumbai Port as customs operations halt
            indefinitely. (Representative image)
          </p>

          <div className="prose mt-6 space-y-4 text-[15px] leading-relaxed text-neutral-800">
            <p>
              <span className="float-left mr-2 text-5xl font-black leading-none">
                C
              </span>
              ustoms officers and clearing staff at the Mumbai Port have begun an
              indefinite strike, bringing import and export clearances to a
              complete halt with immediate effect. Industry bodies warn that the
              stoppage could cascade across supply chains within days, with
              perishable and time-sensitive electronics shipments most exposed.
            </p>
            <p>
              The strike, called over long-pending wage and staffing disputes, is
              expected to delay clearance of thousands of containers. Freight
              forwarders said semiconductor and electronic-component consignments
              bound for domestic manufacturers are already stuck awaiting
              inspection, with no resolution timeline in sight.
            </p>
            <p>
              "Every day of this strike pushes delivery commitments back by a
              week or more once the backlog is factored in," a senior logistics
              executive said. Manufacturers reliant on just-in-time imports —
              particularly in the electric-vehicle and consumer-electronics
              sectors — face the sharpest risk of production disruption.
            </p>
            <p>
              The Commerce Ministry has reportedly convened an emergency meeting
              with port unions, but officials cautioned that a settlement may
              take several days. Importers have been advised to explore
              alternative ports and re-routing options where feasible.
            </p>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <h3 className="border-b-2 border-neutral-900 pb-1 text-sm font-black uppercase tracking-wide">
            More on this story
          </h3>
          <ul className="mt-3 divide-y divide-neutral-200">
            {RELATED.map((r) => (
              <li key={r.title} className="py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-red-700">
                  {r.tag}
                </p>
                <p className="mt-0.5 text-[14px] font-semibold leading-snug hover:underline">
                  {r.title}
                </p>
                <p className="mt-1 text-[11px] text-neutral-500">{r.time}</p>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
              Market Snapshot
            </p>
            <div className="mt-2 space-y-1.5 text-[13px]">
              <div className="flex justify-between">
                <span>Freight Index</span>
                <span className="font-semibold text-red-700">▲ 4.2%</span>
              </div>
              <div className="flex justify-between">
                <span>Semiconductor ETF</span>
                <span className="font-semibold text-red-700">▼ 1.8%</span>
              </div>
              <div className="flex justify-between">
                <span>Auto Components</span>
                <span className="font-semibold text-red-700">▼ 2.3%</span>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* ---- Presenter control: fires the Slack alert ---- */}
      <PresenterControl status={status} errorMsg={errorMsg} onSend={sendAlert} />
    </div>
  );
}

function PresenterControl({ status, errorMsg, onSend }) {
  const sent = status === "sent";
  const sending = status === "sending";
  return (
    <div className="fixed bottom-5 right-5 z-50 w-72 rounded-xl border border-cyan-500/40 bg-slate-950 p-4 font-sans text-slate-200 shadow-2xl shadow-cyan-500/10">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-cyan-500/20 text-cyan-300">
          ⚡
        </span>
        <div>
          <p className="text-[12px] font-semibold leading-tight text-slate-100">
            Agentforce Monitor
          </p>
          <p className="text-[10px] text-slate-400">Presenter control</p>
        </div>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Listening
        </span>
      </div>

      <p className="mt-3 text-[11px] leading-snug text-slate-400">
        Agent has detected a disruption signal matching an active shipment. Send
        the proactive Slack alert to the operations manager.
      </p>

      <button
        data-testid="send-slack-alert"
        onClick={onSend}
        disabled={sending || sent}
        className={`mt-3 w-full rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
          sent
            ? "bg-emerald-600 text-white"
            : "bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-60"
        }`}
      >
        {sending
          ? "Sending to Slack…"
          : sent
          ? "✓ Alert sent to Slack"
          : "🔔 Send Slack alert"}
      </button>

      {status === "error" && (
        <p className="mt-2 rounded bg-red-950/60 px-2 py-1 text-[10px] text-red-300">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
