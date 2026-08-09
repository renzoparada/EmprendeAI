import { describe, expect, it } from "vitest";
import {
  buildCashFlow,
  buildCompanySnapshot,
  buildIncomeStatement,
  computeAggregateMargins,
  computeBreakEven,
  computePaybackMonths,
  computeProductEconomics,
  computeRoi,
  totalInvestment,
  type EngineFixedCost,
  type EngineProduct,
  type EngineVariableCost,
} from "./financial";
import { applyScenario, DEFAULT_SCENARIO_DELTAS } from "./scenarios";

const simpleProduct: EngineProduct = {
  id: "p1",
  name: "Producto A",
  price: 100,
  variableCost: 40,
  unitsSoldMonthly: 200,
  commissionPct: 0,
  taxPct: 0,
  discountPct: 0,
};

describe("computeProductEconomics (21.1)", () => {
  it("calcula margen unitario, % y contribución marginal sin comisiones/impuestos", () => {
    const eco = computeProductEconomics(simpleProduct, []);
    expect(eco.netPrice).toBe(100);
    expect(eco.unitVariableCost).toBe(40);
    expect(eco.unitMargin).toBe(60);
    expect(eco.unitMarginPct).toBe(60);
    expect(eco.marginalContribution).toBe(60 * 200);
  });

  it("incorpora descuento, comisión, impuesto y costos variables ligados", () => {
    const product: EngineProduct = {
      ...simpleProduct,
      discountPct: 10, // netPrice = 90
      commissionPct: 5, // 4.5
      taxPct: 2, // 1.8
    };
    const linked: EngineVariableCost[] = [{ id: "vc1", amountPerUnit: 3, productId: "p1" }];
    const eco = computeProductEconomics(product, linked, 1 /* 1% de ventas a nivel empresa */);

    expect(eco.netPrice).toBeCloseTo(90);
    // 40 (base) + 4.5 (comisión) + 1.8 (impuesto) + 3 (ligado) + 0.9 (1% de 90)
    expect(eco.unitVariableCost).toBeCloseTo(50.2);
    expect(eco.unitMargin).toBeCloseTo(39.8);
  });

  it("no divide por cero si el precio neto es 0", () => {
    const eco = computeProductEconomics({ ...simpleProduct, price: 0 }, []);
    expect(eco.unitMarginPct).toBe(0);
  });
});

describe("computeAggregateMargins + computeBreakEven (21.1, 21.2)", () => {
  it("calcula el punto de equilibrio en unidades y monto para un solo producto", () => {
    const eco = computeProductEconomics(simpleProduct, []);
    const aggregate = computeAggregateMargins([eco], [simpleProduct]);

    // Margen de contribución = 60/100 = 60%
    expect(aggregate.contributionMarginRatio).toBeCloseTo(0.6);

    const breakEven = computeBreakEven(6000, aggregate, simpleProduct.unitsSoldMonthly);
    // PE unidades = 6000 / (100 - 40) = 100
    expect(breakEven.units).toBeCloseTo(100);
    // PE monetario = 6000 / 0.6 = 10000
    expect(breakEven.amount).toBeCloseTo(10000);
  });

  it("pondera correctamente el punto de equilibrio con múltiples productos", () => {
    const productB: EngineProduct = {
      id: "p2",
      name: "Producto B",
      price: 50,
      variableCost: 30,
      unitsSoldMonthly: 100,
      commissionPct: 0,
      taxPct: 0,
      discountPct: 0,
    };
    const ecoA = computeProductEconomics(simpleProduct, []);
    const ecoB = computeProductEconomics(productB, []);
    const aggregate = computeAggregateMargins([ecoA, ecoB], [simpleProduct, productB]);

    // Ventas = 100*200 + 50*100 = 25000; contribución = 60*200 + 20*100 = 14000
    expect(aggregate.ventas).toBe(25000);
    expect(aggregate.contribucionMarginalTotal).toBe(14000);
    expect(aggregate.contributionMarginRatio).toBeCloseTo(14000 / 25000);
  });
});

describe("buildIncomeStatement y buildCashFlow (§8)", () => {
  it("construye el estado de resultados de ventas a utilidad neta", () => {
    const eco = computeProductEconomics(simpleProduct, []);
    const aggregate = computeAggregateMargins([eco], [simpleProduct]);
    const statement = buildIncomeStatement(aggregate, 8000, 25);

    expect(statement.ventas).toBe(20000);
    expect(statement.costoVentas).toBe(8000);
    expect(statement.utilidadBruta).toBe(12000);
    expect(statement.ebitda).toBe(4000);
    expect(statement.ebit).toBe(4000);
    expect(statement.impuestos).toBe(1000);
    expect(statement.utilidadNeta).toBe(3000);
    expect(statement.margenNetoPct).toBeCloseTo(15);
  });

  it("no cobra impuestos si el EBIT es negativo", () => {
    const eco = computeProductEconomics(simpleProduct, []);
    const aggregate = computeAggregateMargins([eco], [simpleProduct]);
    const statement = buildIncomeStatement(aggregate, 50000, 25);
    expect(statement.ebit).toBeLessThan(0);
    expect(statement.impuestos).toBe(0);
    expect(statement.utilidadNeta).toBe(statement.ebit);
  });

  it("marca alerta de flujo negativo cuando el flujo neto es negativo", () => {
    const eco = computeProductEconomics(simpleProduct, []);
    const aggregate = computeAggregateMargins([eco], [simpleProduct]);
    const statement = buildIncomeStatement(aggregate, 50000, 25);
    const cashFlow = buildCashFlow(1000, statement);
    expect(cashFlow.alertaFlujoNegativo).toBe(true);
  });
});

describe("ROI y Payback (21.3)", () => {
  it("calcula ROI (%) y payback en meses", () => {
    expect(computeRoi(30000, 150000)).toBeCloseTo(20);
    expect(computePaybackMonths(150000, 10000)).toBeCloseTo(15);
    expect(computePaybackMonths(150000, 0)).toBe(Infinity);
  });
});

describe("totalInvestment (§5)", () => {
  it("suma los montos de inversión", () => {
    expect(totalInvestment([1000, 2500, 500])).toBe(4000);
  });
});

describe("applyScenario + buildCompanySnapshot (§9)", () => {
  const fixedCosts: EngineFixedCost[] = [{ id: "f1", amountMonthly: 4000 }];
  const variableCosts: EngineVariableCost[] = [];

  it("el escenario BASE no altera los resultados frente a los datos reales", () => {
    const base = { products: [simpleProduct], fixedCosts, variableCosts };
    const adjusted = applyScenario(base, { type: "BASE", ...DEFAULT_SCENARIO_DELTAS.BASE });
    const snapshotBase = buildCompanySnapshot(base.products, base.variableCosts, base.fixedCosts, 25);
    const snapshotAdjusted = buildCompanySnapshot(adjusted.products, adjusted.variableCosts, adjusted.fixedCosts, 25);
    expect(snapshotAdjusted.statement.utilidadNeta).toBeCloseTo(snapshotBase.statement.utilidadNeta);
  });

  it("el escenario PESIMISTA reduce la utilidad neta frente al BASE", () => {
    const base = { products: [simpleProduct], fixedCosts, variableCosts };
    const pesimista = applyScenario(base, { type: "PESIMISTA", ...DEFAULT_SCENARIO_DELTAS.PESIMISTA });
    const snapshotBase = buildCompanySnapshot(base.products, base.variableCosts, base.fixedCosts, 25);
    const snapshotPesimista = buildCompanySnapshot(
      pesimista.products,
      pesimista.variableCosts,
      pesimista.fixedCosts,
      25
    );
    expect(snapshotPesimista.statement.utilidadNeta).toBeLessThan(snapshotBase.statement.utilidadNeta);
  });

  it("el escenario OPTIMISTA aumenta la utilidad neta frente al BASE", () => {
    const base = { products: [simpleProduct], fixedCosts, variableCosts };
    const optimista = applyScenario(base, { type: "OPTIMISTA", ...DEFAULT_SCENARIO_DELTAS.OPTIMISTA });
    const snapshotBase = buildCompanySnapshot(base.products, base.variableCosts, base.fixedCosts, 25);
    const snapshotOptimista = buildCompanySnapshot(
      optimista.products,
      optimista.variableCosts,
      optimista.fixedCosts,
      25
    );
    expect(snapshotOptimista.statement.utilidadNeta).toBeGreaterThan(snapshotBase.statement.utilidadNeta);
  });
});
