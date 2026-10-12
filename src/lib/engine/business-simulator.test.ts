import { describe, expect, it } from "vitest";
import { computeMonthlyRateFromAnnual, projectMarketing, runBusinessSimulation, type SimulationAssumptions } from "./business-simulator";
import type { EngineFixedCost, EngineProduct, EngineVariableCost } from "./financial";

const product: EngineProduct = {
  id: "p1",
  name: "Producto",
  price: 100,
  variableCost: 40,
  unitsSoldMonthly: 100,
  commissionPct: 0,
  taxPct: 0,
  discountPct: 0,
};

const fixedCost: EngineFixedCost = { id: "f1", amountMonthly: 2000 };
const variableCosts: EngineVariableCost[] = [];

function baseAssumptions(overrides: Partial<SimulationAssumptions> = {}): SimulationAssumptions {
  return {
    horizonMonths: 6,
    monthlySalesGrowthPct: 0,
    priceAdjustmentPct: 0,
    annualInflationPct: 0,
    staffCount: 0,
    avgSalary: 0,
    monthlyStaffGrowthPct: 0,
    investmentEvents: [],
    monthlyDebtService: 0,
    ...overrides,
  };
}

describe("business simulator engine", () => {
  it("computeMonthlyRateFromAnnual convierte 12% anual al mensual compuesto equivalente", () => {
    const monthly = computeMonthlyRateFromAnnual(12);
    expect(monthly).toBeCloseTo(0.9489, 3);
    // Verifica que compuesto 12 veces reproduce el 12% anual.
    expect(Math.pow(1 + monthly / 100, 12) - 1).toBeCloseTo(0.12, 4);
  });

  it("sin ningún supuesto de crecimiento, todos los meses son idénticos", () => {
    const results = runBusinessSimulation([product], variableCosts, [fixedCost], 25, baseAssumptions());
    expect(results).toHaveLength(6);
    for (const row of results) {
      expect(row.ventas).toBeCloseTo(10000);
      expect(row.gastosOperativos).toBeCloseTo(2000);
    }
  });

  it("el crecimiento de ventas compone mes a mes", () => {
    const results = runBusinessSimulation([product], variableCosts, [fixedCost], 25, baseAssumptions({ monthlySalesGrowthPct: 10, horizonMonths: 3 }));
    expect(results[0].ventas).toBeCloseTo(10000 * 1.1);
    expect(results[1].ventas).toBeCloseTo(10000 * 1.1 ** 2);
    expect(results[2].ventas).toBeCloseTo(10000 * 1.1 ** 3);
  });

  it("el ajuste de precio se aplica desde el mes 1 y se mantiene constante", () => {
    const results = runBusinessSimulation([product], variableCosts, [fixedCost], 25, baseAssumptions({ priceAdjustmentPct: 20, horizonMonths: 2 }));
    expect(results[0].ventas).toBeCloseTo(12000);
    expect(results[1].ventas).toBeCloseTo(12000);
  });

  it("la inflación anual sube los costos fijos compuesta mensualmente", () => {
    const results = runBusinessSimulation([product], variableCosts, [fixedCost], 25, baseAssumptions({ annualInflationPct: 12, horizonMonths: 12 }));
    // Después de 12 meses de inflación mensual compuesta desde una tasa anual de 12%, el costo fijo debería crecer ~12%.
    expect(results[11].gastosOperativos).toBeCloseTo(2000 * 1.12, 0);
  });

  it("el costo de personal se agrega como línea adicional sin tocar los costos fijos reales", () => {
    const withStaff = runBusinessSimulation([product], variableCosts, [fixedCost], 25, baseAssumptions({ staffCount: 2, avgSalary: 500 }));
    expect(withStaff[0].gastosOperativos).toBeCloseTo(2000 + 1000);
    // La lista original de costos fijos no debe mutarse.
    expect(fixedCost.amountMonthly).toBe(2000);
  });

  it("el costo de personal crece con su propia tasa mensual", () => {
    const results = runBusinessSimulation([product], variableCosts, [fixedCost], 25, baseAssumptions({ staffCount: 1, avgSalary: 1000, monthlyStaffGrowthPct: 10, horizonMonths: 2 }));
    expect(results[0].gastosOperativos).toBeCloseTo(2000 + 1000 * 1.1);
    expect(results[1].gastosOperativos).toBeCloseTo(2000 + 1000 * 1.1 ** 2);
  });

  it("un evento de inversión solo resta caja en su mes, no en los demás", () => {
    const results = runBusinessSimulation(
      [product],
      variableCosts,
      [fixedCost],
      25,
      baseAssumptions({ horizonMonths: 3, investmentEvents: [{ month: 2, name: "Equipo nuevo", amount: 5000 }] })
    );
    expect(results[0].capex).toBe(0);
    expect(results[1].capex).toBe(5000);
    expect(results[2].capex).toBe(0);
  });

  it("el servicio de deuda se resta todos los meses", () => {
    const results = runBusinessSimulation([product], variableCosts, [fixedCost], 25, baseAssumptions({ monthlyDebtService: 300, horizonMonths: 2 }));
    for (const row of results) {
      expect(row.servicioDeuda).toBe(300);
      expect(row.flujoNetoConDeudaYCapex).toBeCloseTo(row.flujoNeto - 300);
    }
  });

  it("el flujo acumulado suma el flujo neto (con deuda y capex) mes a mes", () => {
    const results = runBusinessSimulation(
      [product],
      variableCosts,
      [fixedCost],
      25,
      baseAssumptions({ horizonMonths: 3, investmentEvents: [{ month: 1, name: "Capex", amount: 1000 }] })
    );
    let expectedAccum = 0;
    for (const row of results) {
      expectedAccum += row.flujoNetoConDeudaYCapex;
      expect(row.flujoAcumulado).toBeCloseTo(expectedAccum);
    }
  });

  it("respeta el horizonte solicitado (12/24/36/60)", () => {
    for (const horizon of [12, 24, 36, 60]) {
      const results = runBusinessSimulation([product], variableCosts, [fixedCost], 25, baseAssumptions({ horizonMonths: horizon }));
      expect(results).toHaveLength(horizon);
      expect(results[results.length - 1].month).toBe(horizon);
    }
  });

  describe("projectMarketing", () => {
    it("proyecta gasto de marketing creciente y clientes nuevos derivados de CPL/conversión constantes", () => {
      const results = projectMarketing(1000, 10, 20, 5, 3);
      expect(results[0].marketingSpend).toBeCloseTo(1050);
      expect(results[0].projectedLeads).toBeCloseTo(105);
      expect(results[0].projectedNewCustomers).toBeCloseTo(21);
      expect(results[2].marketingSpend).toBeCloseTo(1000 * 1.05 ** 3);
    });

    it("no divide por cero cuando el costo por lead es 0", () => {
      const results = projectMarketing(1000, 0, 20, 0, 1);
      expect(results[0].projectedLeads).toBe(0);
      expect(results[0].projectedNewCustomers).toBe(0);
    });
  });
});
