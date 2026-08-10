import { requireCompany } from "@/lib/actions/guard";
import { prisma } from "@/lib/db";
import { buildCompanySnapshot, totalInvestment } from "@/lib/engine/financial";
import { buildPriceSalesHeatmap, computeSensitivityRanking } from "@/lib/engine/sensitivity";
import { computeRiskMatrix } from "@/lib/engine/risk";
import { toEngineFixedCosts, toEngineProducts, toEngineVariableCosts } from "@/lib/mappers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SensitivityRankingChart } from "@/components/sensibilidad/sensitivity-ranking-chart";
import { HeatmapGrid } from "@/components/sensibilidad/heatmap-grid";
import { RiskMatrixTable } from "@/components/sensibilidad/risk-matrix-table";
import { WhatIfSimulator } from "@/components/sensibilidad/what-if-simulator";

const DELTAS = [-20, -10, 0, 10, 20];

export default async function SensibilidadPage() {
  const { company } = await requireCompany();

  const [products, fixedCosts, variableCosts, investments] = await Promise.all([
    prisma.product.findMany({ where: { companyId: company.id } }),
    prisma.fixedCost.findMany({ where: { companyId: company.id } }),
    prisma.variableCost.findMany({ where: { companyId: company.id } }),
    prisma.investment.findMany({ where: { companyId: company.id } }),
  ]);

  const engineProducts = toEngineProducts(products);
  const engineFixedCosts = toEngineFixedCosts(fixedCosts);
  const engineVariableCosts = toEngineVariableCosts(variableCosts);
  const hasData = products.length > 0;
  const inversionTotal = totalInvestment(investments.map((i) => i.amount));

  if (!hasData) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Sensibilidad y Riesgos</h1>
          <p className="text-sm text-slate-500">Top variables de mayor impacto, mapa de calor y matriz de riesgos (spec §9/§17).</p>
        </div>
        <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          Carga productos y costos en la plataforma para activar el análisis de sensibilidad.
        </div>
      </div>
    );
  }

  const snapshot = buildCompanySnapshot(engineProducts, engineVariableCosts, engineFixedCosts, company.taxRatePct);
  const ranking = computeSensitivityRanking({ products: engineProducts, fixedCosts: engineFixedCosts, variableCosts: engineVariableCosts }, company.taxRatePct);
  const heatmap = buildPriceSalesHeatmap({ products: engineProducts, fixedCosts: engineFixedCosts, variableCosts: engineVariableCosts }, company.taxRatePct, DELTAS, DELTAS);
  const risks = computeRiskMatrix({ hasData, snapshot, inversionTotal });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Sensibilidad y Riesgos</h1>
        <p className="text-sm text-slate-500">Top variables de mayor impacto, mapa de calor y matriz de riesgos (spec §9/§17).</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Variables de mayor impacto</CardTitle>
            <CardDescription>Impacto sobre la Utilidad Neta ante un shock del 10% en cada variable, dejando las demás constantes.</CardDescription>
          </CardHeader>
          <CardContent>
            <SensitivityRankingChart data={ranking} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Mapa de calor: Precio × Ventas → Utilidad Neta</CardTitle>
            <CardDescription>Cada celda es la Utilidad Neta simulada combinando un cambio de precio (filas) y de ventas (columnas).</CardDescription>
          </CardHeader>
          <CardContent>
            <HeatmapGrid data={heatmap} currency={company.currency} />
          </CardContent>
        </Card>
      </div>

      <WhatIfSimulator
        products={engineProducts}
        fixedCosts={engineFixedCosts}
        variableCosts={engineVariableCosts}
        taxRatePct={company.taxRatePct}
        currency={company.currency}
        inversionTotal={inversionTotal}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">Matriz de riesgos</CardTitle>
          <CardDescription>Solo se muestran los riesgos que se activan con los datos reales de tu negocio (spec §17.1).</CardDescription>
        </CardHeader>
        <CardContent>
          <RiskMatrixTable risks={risks} />
        </CardContent>
      </Card>
    </div>
  );
}
