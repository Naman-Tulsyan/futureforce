// ---------------------------------------------------------------------------
// Salesforce data layer
// Handles OAuth (client-credentials) with in-memory token caching, plus a
// thin SOQL helper used by the dashboard + agent API routes.
// ---------------------------------------------------------------------------

let cachedToken = null;
let cachedAt = 0;
const TOKEN_TTL_MS = 25 * 60 * 1000; // refresh well before the ~30min expiry

export async function getSalesforceToken({ force = false } = {}) {
  if (!force && cachedToken && Date.now() - cachedAt < TOKEN_TTL_MS) {
    return cachedToken;
  }

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.SALESFORCE_CONSUMER_KEY,
    client_secret: process.env.SALESFORCE_CONSUMER_SECRET,
  });

  const url = `${process.env.SALESFORCE_DOMAIN}/services/oauth2/token`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("[SF] Token error body:", text);
    throw new Error(`Token fetch failed (${res.status}): ${text}`);
  }

  const data = JSON.parse(text);
  cachedToken = data.access_token;
  cachedAt = Date.now();
  return cachedToken;
}

const API_VERSION = "v62.0";

/**
 * Run a SOQL query and return the records array.
 * Retries once with a fresh token on a 401 (expired/invalid token).
 */
export async function runSoql(query, { retry = true } = {}) {
  const token = await getSalesforceToken();
  const url = `${process.env.SALESFORCE_DOMAIN}/services/data/${API_VERSION}/query?q=${encodeURIComponent(
    query
  )}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401 && retry) {
    await getSalesforceToken({ force: true });
    return runSoql(query, { retry: false });
  }

  const text = await res.text();
  if (!res.ok) {
    console.error("[SF] SOQL error:", query, "->", text);
    throw new Error(`SOQL failed (${res.status}): ${text}`);
  }

  return JSON.parse(text).records || [];
}

/**
 * Low-level REST call against the SObject API (create/update/delete).
 * `path` is relative to /services/data/<ver>/ — e.g. "sobjects/News3__c".
 * Retries once with a fresh token on a 401.
 */
export async function sfRest(path, { method = "GET", body, retry = true } = {}) {
  const token = await getSalesforceToken();
  const url = `${process.env.SALESFORCE_DOMAIN}/services/data/${API_VERSION}/${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && retry) {
    await getSalesforceToken({ force: true });
    return sfRest(path, { method, body, retry: false });
  }

  const text = await res.text();
  if (!res.ok) {
    console.error("[SF] REST error:", method, path, "->", text);
    throw new Error(`Salesforce ${method} ${path} failed (${res.status}): ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

export const sfCreate = (object, fields) =>
  sfRest(`sobjects/${object}`, { method: "POST", body: fields });

export const sfUpdate = (object, id, fields) =>
  sfRest(`sobjects/${object}/${id}`, { method: "PATCH", body: fields });

export const sfDelete = (object, id) =>
  sfRest(`sobjects/${object}/${id}`, { method: "DELETE" });
