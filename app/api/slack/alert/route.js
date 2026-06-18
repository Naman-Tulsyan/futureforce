// ---------------------------------------------------------------------------
// Slack alert webhook
// Posts the agent's proactive "disruption detected" alert into Slack so the
// presenter can switch to the Slack tab and show the DM landing in real time.
//
// Configure with SLACK_WEBHOOK_URL (Slack → Your App → Incoming Webhooks).
// The webhook's channel/DM is chosen when you create the webhook in Slack.
// ---------------------------------------------------------------------------

// The default alert mirrors Phase 1 of the demo script. The numbers are kept in
// sync with the seeded Salesforce data (DEL-006 = 7 days overdue, risk 9.1).
const DEFAULT_ALERT = {
  header: "🚨 Critical Supply Chain Alert",
  body:
    "*Breaking news indicates a customs strike at the Mumbai Port.* I'm flagging this as *Critical*.\n\n" +
    "SiliconEdge Corp's semiconductor shipment (*DEL-006*) is already *7 days overdue* at this exact location.\n\n" +
    "Would you like me to assess their current health?",
  fields: [
    "*Supplier:*\nSiliconEdge Corp",
    "*Shipment:*\nDEL-006 · Semiconductor",
    "*Status:*\n:red_circle: Critical · 7 days overdue",
    "*Risk Score:*\n9.1 / 10",
  ],
  context:
    ":robot_face: *Supply Chain Disruption Agent* · Agentforce · cross-referenced with live delivery data",
};

function buildBlocks({ header, body, fields, context }) {
  const blocks = [
    { type: "header", text: { type: "plain_text", text: header, emoji: true } },
    { type: "section", text: { type: "mrkdwn", text: body } },
  ];
  if (fields?.length) {
    blocks.push({
      type: "section",
      fields: fields.map((t) => ({ type: "mrkdwn", text: t })),
    });
  }
  if (context) {
    blocks.push({
      type: "context",
      elements: [{ type: "mrkdwn", text: context }],
    });
  }
  return blocks;
}

export async function POST(req) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) {
    return Response.json(
      {
        error:
          "SLACK_WEBHOOK_URL is not set. Create an Incoming Webhook at api.slack.com/apps and add it to .env.",
      },
      { status: 500 }
    );
  }

  // Allow the caller to override pieces of the alert; fall back to the demo default.
  let overrides = {};
  try {
    overrides = (await req.json()) || {};
  } catch {
    // empty/invalid body → use defaults
  }

  const alert = { ...DEFAULT_ALERT, ...overrides };
  const blocks = overrides.blocks || buildBlocks(alert);

  // text is the notification/fallback (shown in push + notifications list).
  const payload = {
    text: overrides.text || "🚨 Critical Supply Chain Alert — Mumbai Port customs strike",
    blocks,
  };

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const detail = await res.text();
    if (!res.ok) {
      console.error("[Slack] webhook error:", res.status, detail);
      return Response.json(
        { error: `Slack webhook failed (${res.status})`, details: detail },
        { status: 502 }
      );
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[Slack] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
