// Generates demo/demo-flow.excalidraw — import via Excalidraw → menu → Open.
// Run:  node demo/make-flowchart.mjs
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rnd = () => Math.floor(Math.random() * 2 ** 31);
const els = [];

function base(extra) {
  return {
    id: `el${els.length}_${rnd()}`,
    angle: 0, strokeColor: "#1e1e1e", backgroundColor: "transparent",
    fillStyle: "solid", strokeWidth: 2, strokeStyle: "solid", roughness: 1,
    opacity: 100, groupIds: [], frameId: null, roundness: null, seed: rnd(),
    version: 1, versionNonce: rnd(), isDeleted: false, boundElements: [],
    updated: Date.now(), link: null, locked: false, ...extra,
  };
}

function rect(x, y, w, h, { bg = "transparent", stroke = "#1e1e1e", sw = 2, dashed = false } = {}) {
  const r = base({
    type: "rectangle", x, y, width: w, height: h, backgroundColor: bg,
    strokeColor: stroke, strokeWidth: sw, strokeStyle: dashed ? "dashed" : "solid",
    roundness: { type: 3 },
  });
  els.push(r);
  return r;
}

// Centered text bound to a container box.
function label(c, text, { size = 16, color = "#1e1e1e" } = {}) {
  const t = base({
    type: "text", x: c.x + 8, y: c.y + 8, width: c.width - 16, height: c.height - 16,
    strokeColor: color, text, fontSize: size, fontFamily: 1, textAlign: "center",
    verticalAlign: "middle", baseline: Math.round(size * 0.9), containerId: c.id,
    originalText: text, lineHeight: 1.25,
  });
  c.boundElements.push({ type: "text", id: t.id });
  els.push(t);
  return t;
}

// Free-floating text (left aligned) — used for titles and bullet boxes.
function freeText(x, y, text, { size = 16, color = "#1e1e1e", align = "left", w = 320 } = {}) {
  const lines = text.split("\n").length;
  els.push(base({
    type: "text", x, y, width: w, height: Math.round(lines * size * 1.25),
    strokeColor: color, text, fontSize: size, fontFamily: 1, textAlign: align,
    verticalAlign: "top", baseline: Math.round(size * 0.9), containerId: null,
    originalText: text, lineHeight: 1.25,
  }));
}

function arrow(x1, y1, x2, y2, { dashed = false, color = "#1e1e1e" } = {}) {
  els.push(base({
    type: "arrow", x: x1, y: y1, width: Math.abs(x2 - x1), height: Math.abs(y2 - y1),
    strokeColor: color, strokeStyle: dashed ? "dashed" : "solid",
    points: [[0, 0], [x2 - x1, y2 - y1]], lastCommittedPoint: null,
    startBinding: null, endBinding: null, startArrowhead: null, endArrowhead: "arrow",
    roundness: { type: 2 },
  }));
}

// ---- Title ----------------------------------------------------------------
freeText(190, 24, "🚀  Supply Chain Disruption Agent — Live Demo Flow", { size: 28, color: "#6741d9", w: 760 });

// ---- Main vertical flow ---------------------------------------------------
const BX = 200, BW = 320, BH = 88;
const flow = [
  { y: 110, bg: "#ffec99", stroke: "#e8590c", t: "📰   1 · Breaking News\nMumbai Port Customs Strike\n(mock news site)" },
  { y: 290, bg: "#ffc9c9", stroke: "#e03131", t: "🚨   2 · Proactive Slack DM\nDEL-006 Critical · SiliconEdge\n7 days overdue at Mumbai port" },
  { y: 470, bg: "#a5d8ff", stroke: "#1971c2", t: "📊   3 · Dashboard Reacts\nDisruptions ↑ · new Critical risk\n· strike tops the news feed" },
  { y: 650, bg: "#d0bfff", stroke: "#6741d9", t: "🤖   4 · Agentforce Console\nAutomated capability walkthrough" },
  { y: 1040, bg: "#b2f2bb", stroke: "#2f9e44", t: "✅   5 · Dashboard Stabilizes\nRisk clears · NanoChip activated\nMumbai exposure mitigated" },
];
const boxes = flow.map((f) => {
  const r = rect(BX, f.y, BW, BH, { bg: f.bg, stroke: f.stroke, sw: 2 });
  label(r, f.t, { size: 15 });
  return r;
});

// arrows down the main spine (between consecutive boxes 1→2→3→4)
for (let i = 0; i < 3; i++) {
  const a = boxes[i], b = boxes[i + 1];
  arrow(BX + BW / 2, a.y + BH, BX + BW / 2, b.y, { color: "#495057" });
}

// ---- The 5 prompts (to the right of box 4) --------------------------------
const PX = 620, PW = 360, PH = 64, PG = 14, PY0 = 560;
const prompts = [
  { bg: "#f3f0ff", stroke: "#6741d9", t: "①  Health snapshot — At Risk · Total Score · email" },
  { bg: "#f3f0ff", stroke: "#6741d9", t: "②  Monopoly risk — single-source bottleneck" },
  { bg: "#ffd8a8", stroke: "#e8590c", t: "③  Simulation — 4-wk delay → production drop + ₹ revenue hit", wow: true },
  { bg: "#f3f0ff", stroke: "#6741d9", t: "④  Alternatives — NanoChip & ChipMaster (Taiwan)" },
  { bg: "#f3f0ff", stroke: "#6741d9", t: "⑤  Draft email — to procurement, ready to send" },
];
const pboxes = prompts.map((p, i) => {
  const y = PY0 + i * (PH + PG);
  const r = rect(PX, y, PW, PH, { bg: p.bg, stroke: p.stroke, sw: p.wow ? 3 : 1.5 });
  label(r, p.t, { size: 13 });
  return r;
});
// box 4 → prompt stack
arrow(BX + BW, boxes[3].y + BH / 2, PX, pboxes[2].y + PH / 2, { color: "#6741d9" });
// chain the prompts 1→2→3→4→5
for (let i = 0; i < pboxes.length - 1; i++) {
  arrow(PX + PW / 2, pboxes[i].y + PH, PX + PW / 2, pboxes[i + 1].y, { color: "#868e96" });
}
// last prompt → stabilize box
arrow(PX + PW / 2, pboxes[4].y + PH, BX + BW / 2, boxes[4].y, { color: "#2f9e44" });

// ---- "Behind the scenes" tech band ----------------------------------------
freeText(60, 1190, "⚙️  Behind the scenes (this Next.js app + Salesforce + Slack)", { size: 18, color: "#495057", w: 700 });
const TY = 1230, TW = 300, TH = 130;
const sf = rect(60, TY, TW, TH, { bg: "#e9ecef", stroke: "#495057", dashed: true });
freeText(76, TY + 12, "Salesforce\n• Agentforce agent (the brain)\n• Supplier · Delivery objects\n• RiskLog · News records", { size: 13, color: "#212529", w: TW - 28 });
const nx = rect(420, TY, TW, TH, { bg: "#e7f5ff", stroke: "#1971c2", dashed: true });
freeText(436, TY + 12, "Next.js app\n• /news (mock site)\n• Command-center dashboard\n• /api/slack/alert\n• /api/demo/escalate · stabilize", { size: 13, color: "#212529", w: TW - 28 });
const sl = rect(780, TY, TW, TH, { bg: "#fff0f6", stroke: "#e03131", dashed: true });
freeText(796, TY + 12, "Slack\n• Incoming Webhook\n• Proactive alert DM\n  to the operations manager", { size: 13, color: "#212529", w: TW - 28 });

// data-flow arrows in the tech band
arrow(420, TY + TH / 2, 360, TY + TH / 2, { dashed: true, color: "#1971c2" }); // Next.js → Salesforce (REST writes)
freeText(330, TY - 22, "escalate / stabilize\n(writes risks + news)", { size: 11, color: "#1971c2", w: 170, align: "center" });
arrow(720, TY + TH / 2, 780, TY + TH / 2, { dashed: true, color: "#e03131" }); // Next.js → Slack (webhook)
freeText(700, TY - 22, "/api/slack/alert\n(webhook POST)", { size: 11, color: "#e03131", w: 170, align: "center" });

// ---- write file -----------------------------------------------------------
const scene = {
  type: "excalidraw",
  version: 2,
  source: "https://excalidraw.com",
  elements: els,
  appState: { viewBackgroundColor: "#ffffff", gridSize: null },
  files: {},
};
const out = path.join(__dirname, "demo-flow.excalidraw");
writeFileSync(out, JSON.stringify(scene, null, 2));
console.log(`Wrote ${out} (${els.length} elements). Open it in Excalidraw via menu → Open.`);
