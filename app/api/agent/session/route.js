import { getSalesforceToken } from "@/lib/salesforce";
import { randomUUID } from "crypto";

export async function POST() {
  try {
    const token = await getSalesforceToken();
    const agentId = process.env.SALESFORCE_AGENT_ID;
    const orgDomain = process.env.SALESFORCE_DOMAIN;

    const url = `https://api.salesforce.com/einstein/ai-agent/v1/agents/${agentId}/sessions`;
    console.log("[Session] POST", url);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        externalSessionKey: randomUUID(),
        instanceConfig: {
          endpoint: orgDomain,   // e.g. https://orgfarm-xxx.my.salesforce.com
        },
        streamingCapabilities: {
          chunkTypes: ["Text"],  // ← was missing
        },
        bypassUser: true,
      }),
    });

    const text = await res.text();
    console.log("[Session] Status:", res.status, "Body:", text);

    if (!res.ok) {
      // The Agent API returns an empty-body 404 when the agent isn't activated,
      // or when this connected app isn't linked under the agent's Connections.
      const details =
        res.status === 404 && !text.trim()
          ? "Agent not found or not activated for the Agent API. Activate the agent in Agentforce and add this connected app under the agent's Connections tab."
          : text;
      return Response.json({ error: `Session failed (${res.status})`, details }, { status: 500 });
    }

    const data = JSON.parse(text);
    return Response.json({ sessionId: data.sessionId });

  } catch (err) {
    console.error("[Session] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}