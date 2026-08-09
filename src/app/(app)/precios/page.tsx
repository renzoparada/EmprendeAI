import { requireCompany } from "@/lib/actions/guard";
import { prisma } from "@/lib/db";
import { computeProductEconomics } from "@/lib/engine/financial";
import { toEngineFixedCosts } from "@/lib/mappers";
import { ProductSwitcher } from "@/components/precios/product-switcher";
import { PricingWorkbench } from "@/components/precios/pricing-workbench";
import { PricePointsPanel } from "@/components/precios/price-points-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PreciosPage({ searchParams }: { searchParams: Promise<{ productId?: string }> }) {
  const { company } = await requireCompany();
  const { productId } = await searchParams;

  const [products, fixedCosts] = await Promise.all([
    prisma.product.findMany({ where: { companyId: company.id }, orderBy: { createdAt: "asc" } }),
    prisma.fixedCost.findMany({ where: { companyId: company.id } }),
  ]);

  if (products.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Precificación Inteligente</h1>
          <p className="text-sm text-slate-500">Precio mínimo, de equilibrio, objetivo, óptimo y curva de demanda (spec §6).</p>
        </div>
        <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          Agrega al menos un producto en Mi Negocio para usar la Precificación Inteligente.
        </div>
      </div>
    );
  }

  const product = products.find((p) => p.id === productId) ?? products[0];

  const [variableCosts, pricePoints] = await Promise.all([
    prisma.variableCost.findMany({ where: { companyId: company.id } }),
    prisma.pricePoint.findMany({ where: { productId: product.id }, orderBy: { recordedAt: "asc" } }),
  ]);

  const companyWidePctOfSales = variableCosts
    .filter((c) => !c.productId)
    .reduce((sum, c) => sum + (c.pctOfSales ?? 0), 0);
  const economics = computeProductEconomics(product, variableCosts, companyWidePctOfSales);
  const totalFixedCostsMonthly = toEngineFixedCosts(fixedCosts).reduce((sum, c) => sum + c.amountMonthly, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Precificación Inteligente</h1>
          <p className="text-sm text-slate-500">Precio mínimo, de equilibrio, objetivo, óptimo y curva de demanda (spec §6).</p>
        </div>
        <ProductSwitcher products={products} selectedId={product.id} />
      </div>

      <PricingWorkbench
        product={product}
        pricePoints={pricePoints}
        unitVariableCost={economics.unitVariableCost}
        totalFixedCostsMonthly={totalFixedCostsMonthly}
        currency={company.currency}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">Curva de demanda — datos históricos</CardTitle>
        </CardHeader>
        <CardContent>
          <PricePointsPanel productId={product.id} pricePoints={pricePoints} currency={company.currency} />
        </CardContent>
      </Card>
    </div>
  );
}
