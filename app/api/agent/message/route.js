import { getSalesforceToken } from "@/lib/salesforce";

export async function POST(req) {
  try {
    const { sessionId, message, sequenceId } = await req.json();
    const token = await getSalesforceToken();

    // ?sync=true = wait for full response (no streaming needed)
    const url = `https://api.test.salesforce.com/einstein/ai-agent/v1/sessions/${sessionId}/messages?sync=true`;
    console.log("[Message] POST", url);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          sequenceId: sequenceId ?? 1,  // increment per message in a session
          type: "Text",
          text: message,
        },
        variables: [],
      }),
    });

    const text = await res.text();
    console.log("[Message] Status:", res.status, "Body:", text);

    if (!res.ok) {
      return Response.json({ error: `Message failed (${res.status})`, details: text }, { status: 500 });
    }

    const data = JSON.parse(text);

    // Extract agent reply text from response
    const reply =
      data?.messages?.find((m) => m.type === "Inform")?.message ||
      data?.messages?.[0]?.message ||
      data?.message ||
      "No response";

    return Response.json({ reply });

  } catch (err) {
    console.error("[Message] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}