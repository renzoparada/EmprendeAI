/**
 * Traduce los registros de Prisma a los tipos de input del Financial Engine
 * (spec §27: el engine es agnóstico de la capa de persistencia). Se usa
 * tanto en el Dashboard como en Escenarios para garantizar el mismo cálculo.
 */
import type { FixedCost, Product, VariableCost } from "@prisma/client";
import type { EngineFixedCost, EngineProduct, EngineVariableCost } from "@/lib/engine/financial";

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
