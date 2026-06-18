// ---------------------------------------------------------------------------
// Demo: stabilize (Phase 5 finale)
// Resolves the [DEMO] Critical risk and posts a recovery signal, so the
// dashboard's risk metrics visibly settle as the alternative supplier is
// activated. Mirrors "risk metric stabilizing" in the demo script.
// ---------------------------------------------------------------------------
import { runSoql, sfUpdate, sfCreate } from "@/lib/salesforce";
import { DEMO_TAG } from "../escalate/route";

const RECOVERY_NEWS =
  `${DEMO_TAG} UPDATE: EV maker activates NanoChip Semiconductors (Taiwan) as ` +
  `alternate semiconductor source — Mumbai Port exposure mitigated, onboarding initiated.`;

export async function POST() {
  try {
    const open = await runSoql(
      `SELECT Id FROM RiskLog_c__c WHERE Risk_Description_c__c LIKE '%${DEMO_TAG}%' AND Is_Resolved_c__c = false`
    );

    await Promise.all([
      ...open.map((r) => sfUpdate("RiskLog_c__c", r.Id, { Is_Resolved_c__c: true })),
      sfCreate("News3__c", { News3__c: RECOVERY_NEWS }),
    ]);

    return Response.json({ ok: true, resolved: open.length });
  } catch (err) {
    console.error("[Demo/stabilize] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
