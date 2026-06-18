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
      return Response.json({ error: `Session failed (${res.status})`, details: text }, { status: 500 });
    }

    const data = JSON.parse(text);
    return Response.json({ sessionId: data.sessionId });

  } catch (err) {
    console.error("[Session] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}