// ===========================================================================
// End-to-end demo driver: the Mumbai Port Customs Strike scenario.
//
//   1. Open the Operations Dashboard (baseline)
//   2. Open the mock news site and fire the proactive Slack alert
//   3. Switch to Slack to show the agent's DM
//   4. Write the strike into Salesforce; reload the dashboard so it reflects
//   5. Drive the Agentforce console chat through all 5 capability prompts
//   6. Stabilize the data and show the dashboard risk settling
//
// Uses your installed Chrome with a dedicated profile so Salesforce + Slack
// logins persist. Run:  npm run demo   (or MANUAL=1 npm run demo)
// ===========================================================================
import { chromium } from "playwright";
import readline from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";
import config from "./config.mjs";

const MANUAL = process.env.MANUAL === "1";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const profileDir = path.resolve(__dirname, "..", config.profileDir);

const c = {
  reset: "\x1b[0m", dim: "\x1b[2m", cyan: "\x1b[36m",
  green: "\x1b[32m", yellow: "\x1b[33m", red: "\x1b[31m", bold: "\x1b[1m",
};
const log = (m) => console.log(`${c.cyan}▸${c.reset} ${m}`);
const ok = (m) => console.log(`${c.green}✓${c.reset} ${m}`);
const warn = (m) => console.log(`${c.yellow}!${c.reset} ${m}`);
const phase = (n, m) => console.log(`\n${c.bold}${c.cyan}── Phase ${n}: ${m} ──${c.reset}`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function waitForLine(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(`${c.dim}${prompt}${c.reset}`, (ans) => { rl.close(); resolve(ans ?? ""); }));
}
const waitForEnter = (prompt) => waitForLine(prompt);

// Pause between steps: wait for Enter in MANUAL mode, else sleep `ms`.
async function pause(label, ms) {
  if (MANUAL) {
    await waitForEnter(`   ↵ Press Enter to ${label}… `);
  } else {
    log(`${c.dim}${label} in ${(ms / 1000).toFixed(0)}s…${c.reset}`);
    await sleep(ms);
  }
}

async function api(route) {
  const url = `${config.baseUrl}/api/demo/${route}`;
  try {
    const res = await fetch(url, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { warn(`${route}: ${data.error || res.status}`); return null; }
    return data;
  } catch (e) {
    warn(`${route} request failed: ${e.message} (is the app running on ${config.baseUrl}?)`);
    return null;
  }
}

// Distinctive substring of the *Preview (Live Test)* chat box. Deliberately
// avoids the right-hand build copilot ("Ask for help or describe what you'd
// like to build…"), which we must NOT type the demo prompts into.
const PREVIEW_INPUT_RE = /describe your task/i;

async function isVisible(loc) {
  try { return await loc.isVisible(); } catch { return false; }
}

// Locate the Preview chat box across the page + any iframes, trying several
// strategies (real placeholder, ARIA textbox, and raw CSS for contenteditable).
async function locatePreviewInput(page, timeout = 2500) {
  const deadline = Date.now() + timeout;
  const cssSelectors = [
    'textarea[placeholder*="Describe your task" i]',
    'textarea[placeholder*="ask a question" i]',
    '[aria-label*="Describe your task" i]',
    '[data-placeholder*="Describe your task" i]',
    '[placeholder*="Describe your task" i]',
  ];
  do {
    for (const frame of page.frames()) {
      for (const cand of [
        frame.getByPlaceholder(PREVIEW_INPUT_RE),
        frame.getByRole("textbox", { name: PREVIEW_INPUT_RE }),
        ...cssSelectors.map((s) => frame.locator(s)),
      ]) {
        const first = cand.first();
        if (await isVisible(first)) return first;
      }
    }
    await sleep(400);
  } while (Date.now() < deadline);
  return null;
}

// Diagnostic: deep-scan every frame (piercing open shadow roots) and print all
// editable elements, so we can see exactly how the Preview box is built.
async function dumpEditables(page) {
  warn("Diagnostic — scanning every frame + shadow root for editable elements:");
  for (const frame of page.frames()) {
    let found = [];
    try {
      found = await frame.evaluate(() => {
        const out = [];
        const walk = (root) => {
          root.querySelectorAll("*").forEach((el) => {
            const tag = el.tagName.toLowerCase();
            if (
              tag === "textarea" || tag === "input" ||
              el.hasAttribute("contenteditable") || el.getAttribute("role") === "textbox"
            ) {
              const r = el.getBoundingClientRect();
              out.push({
                tag,
                placeholder: el.getAttribute("placeholder") || "",
                aria: el.getAttribute("aria-label") || "",
                dataPh: el.getAttribute("data-placeholder") || "",
                role: el.getAttribute("role") || "",
                editable: el.getAttribute("contenteditable") || "",
                vis: r.width > 1 && r.height > 1,
              });
            }
            if (el.shadowRoot) walk(el.shadowRoot);
          });
        };
        walk(document);
        return out;
      });
    } catch (e) {
      found = [{ error: e.message }];
    }
    if (found.length) {
      console.log(`  · frame: ${frame.url().slice(0, 90) || "(blank)"}`);
      found.forEach((f, i) =>
        console.log(`      [${i}] ` + JSON.stringify(f))
      );
    }
  }
}

// Click the "Preview" tab so the Live Test chat box mounts, trying the main
// document and every iframe with a few selector strategies.
async function openPreviewTab(page) {
  for (const frame of [page.mainFrame(), ...page.frames()]) {
    for (const loc of [
      frame.getByRole("tab", { name: /^preview$/i }),
      frame.getByRole("button", { name: /^preview$/i }),
      frame.getByText(/^Preview$/),
    ]) {
      try { await loc.first().click({ timeout: 1500 }); await sleep(1500); return true; } catch {}
    }
  }
  return false;
}

// Salesforce login/agent-selection is multi-step, so we don't trust a single
// goto. Instead scan EVERY open tab for the Preview chat box (clicking the
// Preview tab on any Salesforce-looking tab first) and use whichever has it.
async function findPreviewAcrossTabs(ctx) {
  for (const page of ctx.pages()) {
    if (page.isClosed()) continue;
    const input = await locatePreviewInput(page, 700);
    if (input) return { page, input };
  }
  // Try to coax a Salesforce tab into showing the Preview, then re-scan.
  for (const page of ctx.pages()) {
    if (page.isClosed() || !/lightning\.force\.com/i.test(page.url())) continue;
    await page.bringToFront().catch(() => {});
    await openPreviewTab(page);
    const input = await locatePreviewInput(page, 1500);
    if (input) return { page, input };
  }
  return null;
}

async function sendPrompt(page, text) {
  // Re-locate the box each time — the Live Test panel re-renders after replies.
  const input = await locatePreviewInput(page, 5000);
  if (!input) throw new Error("Preview chat box vanished");
  await input.click();
  try { await input.fill(""); } catch {}
  await input.type(text, { delay: config.pacing.typeDelayMs });
  await sleep(400);
  if (config.agentSendButtonSelector) {
    await page.click(config.agentSendButtonSelector);
  } else {
    await input.press("Enter");
  }
}

async function main() {
  console.log(`${c.bold}🚀 Mumbai Port Strike — end-to-end demo${c.reset}  ${c.dim}(${MANUAL ? "MANUAL" : "AUTO"} pacing)${c.reset}`);

  // Clean baseline so the run starts fresh and is repeatable.
  log("Resetting demo data to a clean baseline…");
  await api("reset");

  log(`Launching Chrome (profile: ${profileDir})`);
  const ctx = await chromium.launchPersistentContext(profileDir, {
    channel: "chrome",
    headless: false,
    viewport: null,
    args: ["--start-maximized"],
  });

  // Tab manager — track each tab's URL so we can transparently reopen any tab
  // that Chrome or session-restore closes mid-run (the cause of the earlier
  // "Target page has been closed" crash).
  const TAB_URLS = {
    dashboard: config.baseUrl,
    news: `${config.baseUrl}/news`,
    slack: config.slackUrl,
    sfdc: config.agentforceUrl,
  };
  const tabs = {};

  async function openTab(key) {
    const page = await ctx.newPage();
    tabs[key] = page;
    await page.goto(TAB_URLS[key], { waitUntil: "domcontentloaded" }).catch(() => {});
    return page;
  }

  // Bring a tab to the front, reopening it first if it was closed.
  // `reload` re-fetches the page — skip it for the Salesforce tab to keep chat state.
  async function show(key, { reload = false } = {}) {
    let page = tabs[key];
    if (!page || page.isClosed()) {
      if (page) warn(`${key} tab was closed — reopening it.`);
      page = await openTab(key);
    } else if (reload) {
      await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
    }
    await page.bringToFront().catch(() => {});
    return page;
  }

  log("Loading tabs (dashboard, news, Slack, Agentforce)…");
  await openTab("dashboard");
  await openTab("news");
  await openTab("slack");
  await openTab("sfdc");

  // Drop any leftover restored/blank tabs so only our four remain.
  const ours = new Set(Object.values(tabs));
  for (const p of ctx.pages()) {
    if (!ours.has(p)) await p.close().catch(() => {});
  }

  warn("In the LAUNCHED Chrome window, get everything ready:");
  warn("  • Slack — logged in and on the alert DM/channel");
  warn("  • Agentforce — log in → open the Supply Chain Disruption Agent → click the 'Preview' tab");
  warn("    so the 'Describe your task or ask a question…' chat box is visible.");
  await waitForEnter("   ↵ When all tabs are ready, press Enter to start the demo… ");

  // ---- Phase 1: baseline dashboard -------------------------------------
  phase(1, "Operations Dashboard (baseline)");
  await show("dashboard", { reload: true });
  ok("Showing the calm baseline — risk metrics nominal.");
  await pause("open the breaking news", config.pacing.afterDashboard);

  // ---- Phase 1b: news + Slack alert ------------------------------------
  phase("1b", "Breaking news → proactive Slack alert");
  const news = await show("news", { reload: true });
  ok("Headline: 'Mumbai Port Customs Workers Go On Indefinite Strike'");
  const alertBtn = news.getByTestId("send-slack-alert");
  await alertBtn.click();
  try {
    await news.getByText(/Alert sent to Slack/i).waitFor({ timeout: 8000 });
    ok("Agent fired the proactive alert to Slack.");
  } catch {
    warn("Couldn't confirm the 'sent' state — check SLACK_WEBHOOK_URL in .env.");
  }
  await pause("switch to Slack", config.pacing.afterAlert);

  // ---- Phase 1c: Slack DM ----------------------------------------------
  phase("1c", "Slack — the agent's DM");
  await show("slack", { reload: true });
  ok("The critical alert DM is now visible in Slack.");
  await pause("update the live data", config.pacing.afterSlack);

  // ---- Phase 2: write the strike into Salesforce -----------------------
  phase(2, "Live data update — dashboard reflects the strike");
  const esc = await api("escalate");
  if (esc?.ok) ok("Strike written to Salesforce (new Critical risk + news signal).");
  await show("dashboard", { reload: true });
  ok("Dashboard updated: Active Disruptions ↑, new Critical risk, news feed shows the strike.");
  await pause("start the Agentforce conversation", config.pacing.afterEscalate);

  // ---- Phases 2-5: drive the Agentforce console chat -------------------
  phase("3-5", "Agentforce console — automated capability walkthrough");
  await show("sfdc").catch(() => {}); // bring the Salesforce tab forward

  // Salesforce login → select agent → Preview can need manual clicks. Keep
  // scanning every tab for the chat box; pause for you to get it ready if not.
  let found = await findPreviewAcrossTabs(ctx);
  let dumped = false;
  while (!found) {
    warn("Couldn't find the Preview chat box in any open tab yet.");
    if (!dumped) {
      const sf = ctx.pages().find((p) => /lightning\.force\.com/i.test(p.url()));
      if (sf) await dumpEditables(sf);
      dumped = true;
    }
    const ans = await waitForLine(
      "   ↵ In the LAUNCHED Chrome window, get the agent's Preview chat open " +
      "(log in → pick the agent → click the 'Preview' tab so the 'Describe your task…' box shows), " +
      "then press Enter to retry — or type s + Enter to skip and type the prompts yourself: "
    );
    if (ans.trim().toLowerCase() === "s") break;
    found = await findPreviewAcrossTabs(ctx);
  }

  if (!found) {
    warn("Skipping automated prompts. Type these into the Preview chat:");
    config.prompts.forEach((p, i) => console.log(`   ${c.dim}[${i + 1}]${c.reset} ${p}`));
  } else {
    const sfdc = found.page;
    tabs.sfdc = sfdc; // remember the real tab so later steps reuse it
    await sfdc.bringToFront().catch(() => {});
    ok("Found the Preview chat box — starting the walkthrough.");
    for (let i = 0; i < config.prompts.length; i++) {
      const p = config.prompts[i];
      log(`Prompt ${i + 1}/${config.prompts.length}: ${c.dim}${p.slice(0, 70)}…${c.reset}`);
      try {
        await sendPrompt(sfdc, p);
        ok(`Sent prompt ${i + 1}. Waiting for the agent to respond…`);
      } catch (e) {
        warn(`Couldn't send prompt ${i + 1} (${e.message}). Type it manually:\n   ${p}`);
      }
      if (i < config.prompts.length - 1) {
        await pause(`send prompt ${i + 2}`, config.pacing.betweenPrompts);
      } else {
        await pause("show the stabilized dashboard", config.pacing.betweenPrompts);
      }
    }
  }

  // ---- Phase 5b: stabilize ---------------------------------------------
  phase("5b", "Resolution — dashboard risk stabilizes");
  const stab = await api("stabilize");
  if (stab?.ok) ok(`Resolved ${stab.resolved} risk(s) + posted recovery signal.`);
  await show("dashboard", { reload: true });
  ok("Dashboard shows the risk settling as the alternative supplier is activated.");
  await sleep(config.pacing.afterStabilize);

  console.log(`\n${c.green}${c.bold}✓ Demo complete.${c.reset} The browser stays open. Press Enter to close it.`);
  await waitForEnter("");
  await ctx.close();
}

main().catch((e) => { console.error(`${c.red}Demo error:${c.reset}`, e); process.exit(1); });
