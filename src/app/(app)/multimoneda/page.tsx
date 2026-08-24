import { Plus } from "lucide-react";
import { requireCompany } from "@/lib/actions/guard";
import { prisma } from "@/lib/db";
import { buildCompanySnapshot } from "@/lib/engine/financial";
import { computeCurrencyExposurePct, computeImportCost, importCostPerUnit } from "@/lib/engine/currency";
import { applyImportCosts, latestImportCostByProduct, toEngineFixedCosts, toEngineProducts, toEngineVariableCosts } from "@/lib/mappers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KpiCard } from "@/components/shared/kpi-card";
import { Button } from "@/components/ui/button";
import { ExchangeRateFormDialog } from "@/components/multimoneda/exchange-rate-form-dialog";
import { ExchangeRatesTable } from "@/components/multimoneda/exchange-rates-table";
import { ImportCostFormDialog } from "@/components/multimoneda/import-cost-form-dialog";
import { ImportCostsTable } from "@/components/multimoneda/import-costs-table";
import { ExposureSimulator } from "@/components/multimoneda/exposure-simulator";
import { formatPercent } from "@/lib/utils";

export default async function MultimonedaPage() {
  const { company } = await requireCompany();

  const [products, fixedCosts, variableCosts, exchangeRates, importCosts] = await Promise.all([
    prisma.product.findMany({ where: { companyId: company.id } }),
    prisma.fixedCost.findMany({ where: { companyId: company.id } }),
    prisma.variableCost.findMany({ where: { companyId: company.id } }),
    prisma.exchangeRate.findMany({ where: { companyId: company.id }, orderBy: { fromCurrency: "asc" } }),
    prisma.importCost.findMany({ where: { product: { companyId: company.id } }, orderBy: { createdAt: "desc" } }),
  ]);

  const importedProducts = products.filter((p) => p.costOrigin === "IMPORTADO");

  // Prioriza el tipo de cambio OFICIAL si hay varios para la misma moneda de origen.
  const ratesByCurrency: Record<string, number> = {};
  for (const r of exchangeRates) {
    if (!(r.fromCurrency in ratesByCurrency) || r.rateType === "OFICIAL") {
      ratesByCurrency[r.fromCurrency] = r.rate;
    }
  }

  const engineProducts = toEngineProducts(products);
  const engineFixedCosts = toEngineFixedCosts(fixedCosts);
  const engineVariableCosts = toEngineVariableCosts(variableCosts);
  const hasData = products.length > 0;

  const landedProducts = applyImportCosts(engineProducts, products, importCosts, ratesByCurrency);
  const snapshot = hasData ? buildCompanySnapshot(landedProducts, engineVariableCosts, engineFixedCosts, company.taxRatePct) : null;

  const latestByProduct = latestImportCostByProduct(importCosts);
  const importedCostsFunctional = importedProducts.reduce((sum, p) => {
    const entry = latestByProduct.get(p.id);
    const rate = entry ? ratesByCurrency[entry.originCurrency] : undefined;
    if (!entry || !rate) return sum;
    const result = computeImportCost({
      fobCost: entry.fobCost,
      freight: entry.freight,
      insurance: entry.insurance,
      tariffPct: entry.tariffPct,
      exchangeRate: rate,
      nationalizationFees: entry.nationalizationFees,
      bankFee: entry.bankFee,
    });
    return sum + importCostPerUnit(result, entry.quantity) * p.unitsSoldMonthly;
  }, 0);

  const totalCostsFunctional = snapshot ? snapshot.statement.costoVentas + snapshot.statement.gastosOperativos : 0;
  const exposurePct = computeCurrencyExposurePct(totalCostsFunctional, importedCostsFunctional);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Multimoneda / Exposición Cambiaria</h1>
        <p className="text-sm text-slate-500">Tipo de cambio, costos de importación y riesgo cambiario (spec §15).</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard
          label="Exposición cambiaria"
          value={hasData ? formatPercent(exposurePct) : "—"}
          status={exposurePct === 0 ? "neutral" : exposurePct < 15 ? "verde" : exposurePct < 35 ? "amarillo" : "rojo"}
          explanation={{
            meaning: "El % de tus costos totales que están denominados en una moneda distinta a tu moneda funcional.",
            why: "Cuanto mayor la exposición, más te afecta una devaluación o apreciación del tipo de cambio.",
            howCalculated: "Exposición (%) = Costos en moneda extranjera (convertidos) / Costos totales × 100 (spec §15.5).",
            isGoodOrBad: exposurePct < 15 ? "Baja — el tipo de cambio te afecta poco." : exposurePct < 35 ? "Moderada — vale la pena monitorear." : "Alta — un movimiento del tipo de cambio impacta fuerte tu margen.",
            whatToDo: "Si es alta, considera cobertura cambiaria, ajustar precios en función del tipo de cambio, o negociar en tu propia moneda con proveedores.",
          }}
        />
        <KpiCard
          label="Descalce de monedas"
          value={exposurePct > 0 ? "Detectado" : "No detectado"}
          status={exposurePct > 0 ? "amarillo" : "verde"}
          explanation={{
            meaning: "Tienes ingresos en una moneda (tu moneda funcional) y costos en otra (la de tus productos importados).",
            why: "Un descalce de monedas te expone a que tus costos suban en tu moneda sin que tus ingresos lo hagan al mismo ritmo.",
            howCalculated: "Se detecta automáticamente cuando hay productos IMPORTADO con costo de importación calculado (spec §15.3).",
            isGoodOrBad: exposurePct > 0 ? "Existe descalce — revisa el simulador de abajo." : "No hay descalce con los datos actuales.",
            whatToDo: "Evalúa cobertura cambiaria (forwards, cuentas en moneda extranjera) proporcional a tu exposición.",
          }}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">Tipos de cambio</CardTitle>
              <CardDescription>Oficial, paralelo y proyectado — todos convierten a {company.currency} (spec §15.1).</CardDescription>
            </div>
            <ExchangeRateFormDialog
              companyCurrency={company.currency}
              trigger={
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Nuevo tipo de cambio
                </Button>
              }
            />
          </div>
        </CardHeader>
        <CardContent>
          <ExchangeRatesTable rates={exchangeRates} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">Costos de importación</CardTitle>
              <CardDescription>Solo para productos marcados como &quot;Importado&quot; en Mi Negocio (spec §4).</CardDescription>
            </div>
            {importedProducts.length > 0 && (
              <ImportCostFormDialog
                importedProducts={importedProducts}
                trigger={
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                    Nuevo costo de importación
                  </Button>
                }
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ImportCostsTable importCosts={importCosts} importedProducts={importedProducts} ratesByCurrency={new Map(Object.entries(ratesByCurrency))} currency={company.currency} />
        </CardContent>
      </Card>

      {hasData && (
        <ExposureSimulator
          engineProducts={engineProducts}
          productsMeta={products.map((p) => ({ id: p.id, costOrigin: p.costOrigin }))}
          importCosts={importCosts.map((ic) => ({
            productId: ic.productId,
            originCurrency: ic.originCurrency,
            fobCost: ic.fobCost,
            freight: ic.freight,
            insurance: ic.insurance,
            tariffPct: ic.tariffPct,
            nationalizationFees: ic.nationalizationFees,
            bankFee: ic.bankFee,
            quantity: ic.quantity,
            createdAt: ic.createdAt.toISOString(),
          }))}
          ratesByCurrency={ratesByCurrency}
          fixedCosts={engineFixedCosts}
          variableCosts={engineVariableCosts}
          taxRatePct={company.taxRatePct}
          currency={company.currency}
        />
      )}
    </div>
  );
}
