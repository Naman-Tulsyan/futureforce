export async function getSalesforceToken() {
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.SALESFORCE_CONSUMER_KEY,
    client_secret: process.env.SALESFORCE_CONSUMER_SECRET,
  });

  const url = `${process.env.SALESFORCE_DOMAIN}/services/oauth2/token`;
  console.log("[SF] Fetching token from:", url);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const text = await res.text(); // Read as text first
  console.log("[SF] Token response status:", res.status);
  console.log("[SF] Token response body:", text);

  if (!res.ok) {
    throw new Error(`Token fetch failed (${res.status}): ${text}`);
  }

  const data = JSON.parse(text);
  return data.access_token;
}