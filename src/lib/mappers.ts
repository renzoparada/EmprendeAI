/**
 * Traduce los registros de Prisma a los tipos de input del Financial Engine
 * (spec §27: el engine es agnóstico de la capa de persistencia). Se usa
 * tanto en el Dashboard como en Escenarios para garantizar el mismo cálculo.
 */
import type { FixedCost, ImportCost, Product, VariableCost } from "@prisma/client";
import type { EngineFixedCost, EngineProduct, EngineVariableCost } from "@/lib/engine/financial";
import { computeImportCost, importCostPerUnit } from "@/lib/engine/currency";

export function toEngineProducts(products: Product[]): EngineProduct[] {
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    variableCost: p.variableCost,
    unitsSoldMonthly: p.unitsSoldMonthly,
    commissionPct: p.commissionPct,
    taxPct: p.taxPct,
    discountPct: p.discountPct,
  }));
}

export function toEngineFixedCosts(costs: FixedCost[]): EngineFixedCost[] {
  return costs.map((c) => ({
    id: c.id,
    // Normaliza a base mensual (spec §4: periodicidad mensual/anual).
    amountMonthly: c.periodicity === "ANUAL" ? c.amount / 12 : c.amount,
  }));
}

export function toEngineVariableCosts(costs: VariableCost[]): EngineVariableCost[] {
  return costs.map((c) => ({
    id: c.id,
    amountPerUnit: c.amountPerUnit,
    pctOfSales: c.pctOfSales,
    productId: c.productId,
  }));
}

// ---------------------------------------------------------------------------
// Multimoneda (§15) — costo de importación integrado al engine
// ---------------------------------------------------------------------------

/** Subconjunto de campos de ImportCost que el engine necesita — permite pasar
 * datos ya serializados desde un componente cliente (ej. createdAt como
 * Date reconstruido) sin acoplarse al tipo completo de Prisma. */
export type ImportCostLike = Pick<
  ImportCost,
  "productId" | "originCurrency" | "fobCost" | "freight" | "insurance" | "tariffPct" | "nationalizationFees" | "bankFee" | "quantity" | "createdAt"
>;

/** Toma el registro de importación más reciente por producto (§4: "current" del submódulo). */
export function latestImportCostByProduct(importCosts: ImportCostLike[]): Map<string, ImportCostLike> {
  const map = new Map<string, ImportCostLike>();
  for (const ic of importCosts) {
    const current = map.get(ic.productId);
    if (!current || ic.createdAt > current.createdAt) map.set(ic.productId, ic);
  }
  return map;
}

/**
 * Suma al costo variable base de los productos IMPORTADO el costo de
 * importación por unidad (fórmula 6.3/21.13), convertido con el tipo de
 * cambio vigente (o simulado con `exchangeRateShockPct`). Los productos
 * LOCAL, o IMPORTADO sin tipo de cambio cargado para su moneda de origen,
 * quedan sin modificar — nunca se asume una tasa que el usuario no cargó.
 */
export function applyImportCosts(
  engineProducts: EngineProduct[],
  products: Pick<Product, "id" | "costOrigin">[],
  importCosts: ImportCostLike[],
  ratesByCurrency: Record<string, number>,
  exchangeRateShockPct: number = 0
): EngineProduct[] {
  const productById = new Map(products.map((p) => [p.id, p]));
  const latestByProduct = latestImportCostByProduct(importCosts);

  return engineProducts.map((ep) => {
    const product = productById.get(ep.id);
    if (!product || product.costOrigin !== "IMPORTADO") return ep;

    const entry = latestByProduct.get(ep.id);
    if (!entry) return ep;

    const baseRate = ratesByCurrency[entry.originCurrency];
    if (!baseRate) return ep;

    const shockedRate = baseRate * (1 + exchangeRateShockPct / 100);
    const result = computeImportCost({
      fobCost: entry.fobCost,
      freight: entry.freight,
      insurance: entry.insurance,
      tariffPct: entry.tariffPct,
      exchangeRate: shockedRate,
      nationalizationFees: entry.nationalizationFees,
      bankFee: entry.bankFee,
    });
    const perUnit = importCostPerUnit(result, entry.quantity);

    return { ...ep, variableCost: ep.variableCost + perUnit };
  });
}
