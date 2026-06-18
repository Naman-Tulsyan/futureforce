// ---------------------------------------------------------------------------
// Demo: reset
// Deletes every [DEMO]-tagged record (risks + news) so the next run starts
// from the same clean baseline. Safe to call any number of times.
// ---------------------------------------------------------------------------
import { runSoql, sfDelete } from "@/lib/salesforce";
import { DEMO_TAG } from "../escalate/route";

export async function POST() {
  try {
    const [risks, news] = await Promise.all([
      runSoql(`SELECT Id FROM RiskLog_c__c WHERE Risk_Description_c__c LIKE '%${DEMO_TAG}%'`),
      runSoql(`SELECT Id FROM News3__c WHERE News3__c LIKE '%${DEMO_TAG}%'`),
    ]);

    await Promise.all([
      ...risks.map((r) => sfDelete("RiskLog_c__c", r.Id)),
      ...news.map((n) => sfDelete("News3__c", n.Id)),
    ]);

    return Response.json({ ok: true, deleted: { risks: risks.length, news: news.length } });
  } catch (err) {
    console.error("[Demo/reset] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
