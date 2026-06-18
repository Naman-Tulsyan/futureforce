import { runSoql } from "@/lib/salesforce";

export const dynamic = "force-dynamic";

// 48h silence window for "Silent Supplier" detection. Because the seeded
// Last_Update_Received timestamps are historical, silence is measured relative
// to the freshest update in the dataset rather than wall-clock now.
const SILENT_WINDOW_MS = 48 * 60 * 60 * 1000;
const HIGH_RISK = 6; // delivery risk score (0-10) at/above which a delivery is "at risk"

const num = (v) => (typeof v === "number" ? v : v == null ? 0 : Number(v) || 0);

export async function GET() {
  try {
    const [
      suppliersRaw,
      deliveriesRaw,
      materialsRaw,
      risksRaw,
      simsRaw,
      historyRaw,
      newsRaw,
      configRaw,
    ] = await Promise.all([
      runSoql(
        `SELECT Id, Name__c, Region_c__c, Location_c__c, Material_Type_c__c, Status_c__c, Is_Active_c__c,
                Financial_Health_Score_c__c, Quality_Score_c__c, Credit_Score_c__c, Stability_Score_c__c,
                On_Time_Delivery_Rate_c__c, Overall_Score__c, Cost_Per_Unit_c__c, Max_Capacity_Units_c__c,
                Current_Capacity_Units_c__c, Monthly_Volume__c, Last_Update_Received_c__c
         FROM Supplier_c__c ORDER BY Overall_Score__c DESC`
      ),
      runSoql(
        `SELECT Delivery_Name_c__c, Supplier_Name_c__c, Material_Type_c__c, Status_c__c, Delay_Days_c__c,
                Risk_Score_c__c, Quantity_Units_c__c, Expected_Delivery_Date_c__c
         FROM Delivery_c__c ORDER BY Risk_Score_c__c DESC`
      ),
      runSoql(
        `SELECT Supplier_Name_c__c, Material_Type_c__c, Monthly_Volume_c__c, Is_Primary_c__c
         FROM SupplierMaterial_c__c`
      ),
      runSoql(
        `SELECT Supplier_Name_c__c, Risk_Type_c__c, Risk_Severity_c__c, Risk_Description_c__c,
                Is_Resolved_c__c, Detected_Date_c__c
         FROM RiskLog_c__c ORDER BY Detected_Date_c__c DESC`
      ),
      runSoql(
        `SELECT Supplier_Name_c__c, Production_Drop_Percent_c__c, Revenue_Impact_INR_c__c,
                Extra_Cost_From_Alts_c__c, Alternative_Coverage_Percent_c__c, Coverage_Gap_Units__c,
                Simulation_Summary_c__c, Run_Date_c__c
         FROM SimulationResult_c__c ORDER BY Run_Date_c__c DESC`
      ),
      runSoql(
        `SELECT Supplier_Name_c__c, Stability_Score_c__c, Financial_Health_Score_c__c, Quality_Score_c__c,
                On_Time_Delivery_Rate_c__c, Score_Date_c__c
         FROM SupplierScoreHistory_c__c ORDER BY Score_Date_c__c ASC`
      ),
      runSoql(`SELECT News3__c, CreatedDate FROM News3__c ORDER BY CreatedDate DESC LIMIT 25`),
      runSoql(`SELECT Monthly_Revenue_INR__c FROM EV_Config__c LIMIT 1`),
    ]);

    // ---- normalize -------------------------------------------------------
    // Some objects store a Supplier *record Id* in their "Supplier_Name" field
    // (e.g. SimulationResult). Build an Id -> readable name map to resolve them.
    const idToSupplierName = {};
    suppliersRaw.forEach((s) => {
      if (s.Id && s.Name__c) {
        idToSupplierName[s.Id] = s.Name__c;
        idToSupplierName[s.Id.slice(0, 15)] = s.Name__c; // 15-char form too
      }
    });
    const resolveSupplier = (v) => (v && idToSupplierName[v]) || v;

    const suppliers = suppliersRaw.map((s) => ({
      name: s.Name__c,
      region: s.Region_c__c,
      location: s.Location_c__c,
      material: s.Material_Type_c__c,
      status: s.Status_c__c,
      active: !!s.Is_Active_c__c,
      financialHealth: num(s.Financial_Health_Score_c__c),
      quality: num(s.Quality_Score_c__c),
      credit: num(s.Credit_Score_c__c),
      stability: num(s.Stability_Score_c__c),
      onTimeRate: num(s.On_Time_Delivery_Rate_c__c),
      overall: num(s.Overall_Score__c),
      costPerUnit: num(s.Cost_Per_Unit_c__c),
      maxCapacity: num(s.Max_Capacity_Units_c__c),
      currentCapacity: num(s.Current_Capacity_Units_c__c),
      monthlyVolume: num(s.Monthly_Volume__c),
      lastUpdate: s.Last_Update_Received_c__c,
    }));

    const deliveries = deliveriesRaw.map((d) => ({
      name: d.Delivery_Name_c__c,
      supplier: d.Supplier_Name_c__c,
      material: d.Material_Type_c__c,
      status: d.Status_c__c,
      delayDays: num(d.Delay_Days_c__c),
      risk: num(d.Risk_Score_c__c),
      quantity: num(d.Quantity_Units_c__c),
      eta: d.Expected_Delivery_Date_c__c,
    }));

    const materials = materialsRaw.map((m) => ({
      supplier: m.Supplier_Name_c__c,
      material: m.Material_Type_c__c,
      monthlyVolume: num(m.Monthly_Volume_c__c),
      primary: !!m.Is_Primary_c__c,
    }));

    const risks = risksRaw.map((r) => ({
      supplier: r.Supplier_Name_c__c,
      type: r.Risk_Type_c__c,
      severity: r.Risk_Severity_c__c,
      description: r.Risk_Description_c__c,
      resolved: !!r.Is_Resolved_c__c,
      detected: r.Detected_Date_c__c,
    }));

    const simSeen = new Set();
    const simulations = simsRaw
      .map((s) => ({
        supplier: resolveSupplier(s.Supplier_Name_c__c),
        productionDrop: Math.abs(num(s.Production_Drop_Percent_c__c)),
        revenueImpact: num(s.Revenue_Impact_INR_c__c),
        extraCost: num(s.Extra_Cost_From_Alts_c__c),
        coverage: num(s.Alternative_Coverage_Percent_c__c),
        coverageGap: num(s.Coverage_Gap_Units__c),
        summary: s.Simulation_Summary_c__c,
        runDate: s.Run_Date_c__c,
      }))
      // collapse the duplicate seed rows (same supplier + same outcome)
      .filter((s) => {
        const key = `${s.supplier}|${s.productionDrop}|${s.coverage}|${s.revenueImpact}`;
        if (simSeen.has(key)) return false;
        simSeen.add(key);
        return true;
      });

    const scoreHistory = historyRaw.map((h) => ({
      supplier: h.Supplier_Name_c__c,
      stability: num(h.Stability_Score_c__c),
      financialHealth: num(h.Financial_Health_Score_c__c),
      quality: num(h.Quality_Score_c__c),
      onTimeRate: num(h.On_Time_Delivery_Rate_c__c),
      date: h.Score_Date_c__c,
    }));

    const news = newsRaw
      .map((n) => ({ text: n.News3__c, date: n.CreatedDate }))
      .filter((n) => n.text);

    const monthlyRevenue = num(configRaw[0]?.Monthly_Revenue_INR__c);

    // ---- derived KPIs ----------------------------------------------------
    const activeSuppliers = suppliers.filter((s) => s.active);

    // Silent suppliers: no update within 48h of the freshest update we have.
    const latestUpdateMs = Math.max(
      0,
      ...suppliers.map((s) => (s.lastUpdate ? new Date(s.lastUpdate).getTime() : 0))
    );
    const silentSuppliers = activeSuppliers.filter(
      (s) =>
        s.lastUpdate &&
        latestUpdateMs - new Date(s.lastUpdate).getTime() > SILENT_WINDOW_MS
    );

    const atRiskDeliveries = deliveries.filter(
      (d) => d.risk >= HIGH_RISK || d.status === "Delayed"
    );
    const delayedDeliveries = deliveries.filter((d) => d.status === "Delayed");

    const openRisks = risks.filter((r) => !r.resolved);
    const criticalRisks = openRisks.filter(
      (r) => (r.severity || "").toLowerCase() === "critical"
    );

    // Monopoly materials: material types served by exactly one active supplier.
    const materialSupplierMap = {};
    activeSuppliers.forEach((s) => {
      if (!s.material) return;
      (materialSupplierMap[s.material] ||= new Set()).add(s.name);
    });
    const monopolyMaterials = Object.entries(materialSupplierMap)
      .filter(([, set]) => set.size === 1)
      .map(([material, set]) => ({ material, supplier: [...set][0] }));

    const avgOnTime =
      activeSuppliers.reduce((a, s) => a + s.onTimeRate, 0) /
      (activeSuppliers.length || 1);

    // Potential revenue at risk: a transparent heuristic the manager can trust.
    // Each delayed/at-risk delivery exposes a fraction of monthly revenue equal
    // to that delivery's share of total monthly volume, scaled by its risk.
    const totalMonthlyVolume =
      activeSuppliers.reduce((a, s) => a + s.monthlyVolume, 0) || 1;
    const revenueAtRisk = atRiskDeliveries.reduce((sum, d) => {
      const share = d.quantity / totalMonthlyVolume;
      const riskFactor = Math.min(1, d.risk / 10);
      return sum + monthlyRevenue * share * riskFactor;
    }, 0);

    // Material × Region risk heatmap (avg delivery risk, supplier count).
    const regions = [...new Set(activeSuppliers.map((s) => s.region).filter(Boolean))].sort();
    const materialTypes = [
      ...new Set(activeSuppliers.map((s) => s.material).filter(Boolean)),
    ].sort();

    const supplierByName = Object.fromEntries(suppliers.map((s) => [s.name, s]));
    const heatmap = materialTypes.map((material) => ({
      material,
      cells: regions.map((region) => {
        const cellSuppliers = activeSuppliers.filter(
          (s) => s.material === material && s.region === region
        );
        const cellDeliveries = deliveries.filter((d) => {
          const sup = supplierByName[d.supplier];
          return d.material === material && sup && sup.region === region;
        });
        const avgRisk =
          cellDeliveries.reduce((a, d) => a + d.risk, 0) /
          (cellDeliveries.length || 1);
        return {
          region,
          suppliers: cellSuppliers.length,
          avgRisk: cellSuppliers.length ? avgRisk : null,
        };
      }),
    }));

    const kpis = {
      monthlyRevenue,
      activeDisruptions: openRisks.length,
      criticalRisks: criticalRisks.length,
      atRiskDeliveries: atRiskDeliveries.length,
      delayedDeliveries: delayedDeliveries.length,
      totalDeliveries: deliveries.length,
      silentSuppliers: silentSuppliers.length,
      silentSupplierNames: silentSuppliers.map((s) => s.name),
      monopolyRisks: monopolyMaterials.length,
      monopolyMaterials,
      avgOnTime,
      totalSuppliers: suppliers.length,
      activeSuppliers: activeSuppliers.length,
      revenueAtRisk,
    };

    return Response.json({
      generatedAt: new Date().toISOString(),
      kpis,
      suppliers,
      deliveries,
      materials,
      risks,
      simulations,
      scoreHistory,
      news,
      heatmap: { regions, materialTypes, rows: heatmap },
    });
  } catch (err) {
    console.error("[Dashboard] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
