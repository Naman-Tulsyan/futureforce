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
    if (!sessionId) { pendingRef.current = msg; return; }
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
      {open && <div className="fixed inset-0 z-40 bg-black/15 backdrop-blur-sm md:hidden" onClick={onClose} />}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-[#E2E8F0] bg-white shadow-2xl shadow-black/8 transition-transform duration-300 sm:w-[440px] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E293B] text-sm text-white shadow-sm">⚡</span>
            <div>
              <h2 className="text-[13px] font-bold text-[#0F172A]">Agentforce Co-Pilot</h2>
              <p className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                <span className={`h-1.5 w-1.5 rounded-full ${sessionId ? "bg-[#047857]" : "bg-[#B91C1C]"}`} />
                {sessionId ? "Connected" : "Connecting…"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors">✕</button>
        </header>

        {error && <div className="border-b border-[#FECACA] bg-[#FEF2F2] px-5 py-2.5 text-[11px] font-medium text-[#B91C1C]">{error}</div>}

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && !loading && (
            <div className="mt-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F5F9]">
                <span className="text-xl">💬</span>
              </div>
              <p className="text-sm font-medium text-[#475569]">Ask your Supply Chain Intelligence Officer anything.</p>
              <p className="mt-1 text-[11px] text-[#94A3B8]">e.g. "Draft an email to the tyre supplier requesting a status update."</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap px-4 py-3 text-[13px] leading-relaxed ${
                  m.role === "user"
                    ? "rounded-2xl rounded-br-md bg-[#1E293B] text-white"
                    : "rounded-2xl rounded-bl-md border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A]"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#475569] [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#475569] [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#475569]" />
              <span className="ml-1 font-medium">Agent is analyzing…</span>
            </div>
          )}
        </div>

        <div className="border-t border-[#E2E8F0] p-4">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => send(a.prompt)}
                disabled={loading}
                className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-[10px] font-semibold text-[#64748B] transition-all duration-150 hover:bg-[#F1F5F9] hover:text-[#1E293B] hover:border-[#CBD5E1] disabled:opacity-40"
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
              className="flex-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E293B]/5 transition-all"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="rounded-lg bg-[#1E293B] px-5 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#0F172A] disabled:opacity-30"
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
