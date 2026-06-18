// ---------------------------------------------------------------------------
// Demo: escalate
// Writes the Mumbai Port strike into Salesforce so the dashboard reflects it
// live — a fresh breaking-news signal + a Critical risk on SiliconEdge Corp.
// All records are tagged [DEMO] so /api/demo/reset can remove them cleanly.
// ---------------------------------------------------------------------------
import { sfCreate, runSoql } from "@/lib/salesforce";

export const DEMO_TAG = "[DEMO]";

const NEWS =
  `${DEMO_TAG} BREAKING: Mumbai Port customs workers begin an indefinite strike — ` +
  `semiconductor and electronics shipments stuck in customs hold with no clearance timeline.`;

const RISK = {
  Supplier_Name_c__c: "SiliconEdge Corp",
  Risk_Type_c__c: "External Disruption",
  Risk_Severity_c__c: "Critical",
  Risk_Description_c__c:
    `${DEMO_TAG} Mumbai Port customs strike has frozen clearance of DEL-006 ` +
    `(semiconductor shipment, already 7 days overdue). Production exposure flagged — ` +
    `single-source dependency on SiliconEdge for baseline semiconductor volume.`,
  Is_Resolved_c__c: false,
};

export async function POST() {
  try {
    // Avoid stacking duplicates if the demo is re-run without a reset.
    const existing = await runSoql(
      `SELECT Id FROM RiskLog_c__c WHERE Risk_Description_c__c LIKE '%${DEMO_TAG}%' AND Is_Resolved_c__c = false`
    );
    if (existing.length) {
      return Response.json({ ok: true, skipped: "already escalated", riskId: existing[0].Id });
    }

    const detected = new Date().toISOString();
    const [news, risk] = await Promise.all([
      sfCreate("News3__c", { News3__c: NEWS }),
      sfCreate("RiskLog_c__c", { ...RISK, Detected_Date_c__c: detected }),
    ]);

    return Response.json({ ok: true, newsId: news.id, riskId: risk.id });
  } catch (err) {
    console.error("[Demo/escalate] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
