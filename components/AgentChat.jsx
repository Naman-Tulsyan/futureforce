"use client";
import { useState, useEffect, useRef } from "react";

export default function AgentChat() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const seqRef = useRef(1); // tracks sequenceId per session

  useEffect(() => {
    fetch("/api/agent/session", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (d.sessionId) {
          setSessionId(d.sessionId);
          setError(null);
        } else {
          setError("Failed to start session: " + (d.error || "unknown error"));
        }
      })
      .catch((e) => setError("Network error: " + e.message));
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || !sessionId || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/agent/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: userMsg,
          sequenceId: seqRef.current++,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "agent", text: data.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: "agent", text: "Error: " + (data.error || "no reply") }]);
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: "agent", text: "Network error: " + e.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: "40px auto", fontFamily: "sans-serif", border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ background: "#0176d3", color: "#fff", padding: "12px 16px", fontWeight: "bold" }}>
        Agentforce Chat {sessionId ? "🟢" : "🔴"}
      </div>

      {error && (
        <div style={{ background: "#fee", color: "#c00", padding: "8px 16px", fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ padding: 16, height: 360, overflowY: "auto", background: "#f9f9f9" }}>
        {messages.length === 0 && !loading && (
          <p style={{ color: "#999", textAlign: "center", marginTop: 80 }}>
            {sessionId ? "Send a message to start" : "Connecting to agent..."}
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            marginBottom: 12,
            display: "flex",
            justifyContent: m.role === "user" ? "flex-end" : "flex-start",
          }}>
            <div style={{
              background: m.role === "user" ? "#0176d3" : "#fff",
              color: m.role === "user" ? "#fff" : "#111",
              padding: "8px 12px",
              borderRadius: 12,
              maxWidth: "75%",
              border: m.role === "agent" ? "1px solid #ddd" : "none",
              fontSize: 14,
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ color: "#999", fontSize: 13, fontStyle: "italic" }}>Agent is typing...</div>
        )}
      </div>

      <div style={{ display: "flex", padding: 12, borderTop: "1px solid #ddd", background: "#fff" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder={sessionId ? "Type a message..." : "Connecting..."}
          disabled={!sessionId || loading}
          style={{ flex: 1, padding: "8px 12px", border: "1px solid #ccc", borderRadius: 6, fontSize: 14 }}
        />
        <button
          onClick={sendMessage}
          disabled={!sessionId || loading || !input.trim()}
          style={{ marginLeft: 8, padding: "8px 16px", background: "#0176d3", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 }}
        >
          Send
        </button>
      </div>
    </div>
  );
}