import { getSalesforceToken } from "@/lib/salesforce";

export async function GET() {
  try {
    const token = await getSalesforceToken();

    // Query all bots (agents) in the org
    const url = `${process.env.SALESFORCE_DOMAIN}/services/data/v62.0/query?q=SELECT+Id+FROM+BotDefinition`;
    console.log("[List] Querying agents at:", url);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await res.text();
    console.log("[List] Status:", res.status);
    console.log("[List] Body:", text);

    return Response.json(JSON.parse(text));
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}