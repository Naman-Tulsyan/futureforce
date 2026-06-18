"use client";
import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";

// Ordered to follow the Mumbai Port strike demo script (Phases 2-5). Click 1→5.
const QUICK_ACTIONS = [
  { label: "1 · Health snapshot", prompt: "Yes, pull a health snapshot on SiliconEdge Corp. Please include their new Total Score and their registered contact email." },
  { label: "2 · Monopoly risk", prompt: "Are there any monopoly risks tied to SiliconEdge Corp for our semiconductor supply?" },
  { label: "3 · Simulate delay", prompt: "Take this customs hold into account and run a simulation. If SiliconEdge Corp faces a full 4-week delay, what is the projected production drop and revenue impact for this quarter?" },
  { label: "4 · Alternatives", prompt: "That revenue impact is too high. Find alternative semiconductor suppliers who do not route through India. Rank them by their Quality Score and Total Score." },
  { label: "5 · Draft email", prompt: "Let's pivot to NanoChip Semiconductors. Draft an urgent email to our internal procurement team summarizing the Mumbai port strike, the simulated revenue loss, and our recommendation to initiate onboarding with NanoChip immediately." },
];

/**
 * Agentforce chat drawer. Exposes an imperative `ask(prompt)` so dashboard
 * widgets can deep-link a question straight into the agent.
 */
const AgentChat = forwardRef(function AgentChat({ open, onClose }, ref) {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const seqRef = useRef(1);
  const scrollRef = useRef(null);
  const pendingRef = useRef(null);

  useEffect(() => {
    fetch("/api/agent/session", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (d.sessionId) { setSessionId(d.sessionId); setError(null); }
        else setError("Failed to start session: " + (d.error || "unknown") + (d.details ? " — " + d.details : ""));
      })
      .catch((e) => setError("Network error: " + e.message));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    if (!sessionId) { pendingRef.current = msg; return; } // queue until session ready
    setInput("");
    setMessages((p) => [...p, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/agent/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: msg, sequenceId: seqRef.current++ }),
      });
      const data = await res.json();
      setMessages((p) => [...p, { role: "agent", text: data.reply || "Error: " + (data.error || "no reply") }]);
    } catch (e) {
      setMessages((p) => [...p, { role: "agent", text: "Network error: " + e.message }]);
    } finally {
      setLoading(false);
    }
  };

  // flush a queued question once the session connects
  useEffect(() => {
    if (sessionId && pendingRef.current) {
      const q = pendingRef.current;
      pendingRef.current = null;
      send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useImperativeHandle(ref, () => ({
    ask: (prompt) => send(prompt),
  }));

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden" onClick={onClose} />}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-slate-800 bg-slate-950 shadow-2xl transition-transform duration-300 sm:w-[400px] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-cyan-950/60 to-slate-900 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-500/20 text-cyan-300">⚡</span>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Agentforce Co-Pilot</h2>
              <p className="flex items-center gap-1 text-[11px] text-slate-400">
                <span className={`h-1.5 w-1.5 rounded-full ${sessionId ? "bg-emerald-400" : "bg-red-400"}`} />
                {sessionId ? "Connected" : "Connecting…"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200">✕</button>
        </header>

        {error && <div className="bg-red-950/60 px-4 py-2 text-[11px] text-red-300">{error}</div>}

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && !loading && (
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">Ask your Supply Chain Intelligence Officer anything.</p>
              <p className="mt-1 text-[11px] text-slate-600">e.g. “Draft an email to the tyre supplier requesting a status update.”</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
                  m.role === "user"
                    ? "rounded-br-sm bg-cyan-600 text-white"
                    : "rounded-bl-sm border border-slate-800 bg-slate-900 text-slate-200"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400" />
              <span className="ml-1">Agent is analyzing…</span>
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 p-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => send(a.prompt)}
                disabled={loading}
                className="rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[11px] text-slate-300 transition-colors hover:border-cyan-500 hover:text-cyan-300 disabled:opacity-50"
              >
                {a.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={sessionId ? "Ask the agent…" : "Connecting…"}
              disabled={loading}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="rounded-lg bg-cyan-600 px-4 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      </aside>
    </>
  );
});

export default AgentChat;
