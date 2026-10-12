import { describe, expect, it } from "vitest";
import { computeCurrencyExposurePct, computeImportCost, convertAmount, importCostPerUnit } from "./currency";

describe("convertAmount (21.13)", () => {
  it("multiplica el monto de origen por el tipo de cambio", () => {
    expect(convertAmount(100, 6.96)).toBeCloseTo(696);
  });
});

describe("computeImportCost (6.3/21.13)", () => {
  it("calcula el costo total de importación en moneda funcional", () => {
    const result = computeImportCost({
      fobCost: 1000,
      freight: 100,
      insurance: 50,
      tariffPct: 10,
      exchangeRate: 7,
      nationalizationFees: 200,
      bankFee: 50,
    });

    // subtotalOrigin = 1150; conArancel = 1265; funcional = 1265*7 = 8855; total = 8855+200+50
    expect(result.subtotalOrigin).toBeCloseTo(1150);
    expect(result.subtotalWithTariff).toBeCloseTo(1265);
    expect(result.subtotalFunctional).toBeCloseTo(8855);
    expect(result.totalFunctional).toBeCloseTo(9105);
  });

  it("un tipo de cambio más alto encarece el costo de importación", () => {
    const base = { fobCost: 1000, freight: 0, insurance: 0, tariffPct: 0, nationalizationFees: 0, bankFee: 0 };
    const low = computeImportCost({ ...base, exchangeRate: 6.5 });
    const high = computeImportCost({ ...base, exchangeRate: 8 });
    expect(high.totalFunctional).toBeGreaterThan(low.totalFunctional);
  });
});

describe("importCostPerUnit", () => {
  it("divide el costo total entre las unidades del lote", () => {
    const result = computeImportCost({
      fobCost: 1000,
      freight: 0,
      insurance: 0,
      tariffPct: 0,
      exchangeRate: 7,
      nationalizationFees: 0,
      bankFee: 0,
    });
    expect(importCostPerUnit(result, 100)).toBeCloseTo(70);
  });

  it("devuelve 0 si no hay unidades", () => {
    const result = computeImportCost({ fobCost: 100, freight: 0, insurance: 0, tariffPct: 0, exchangeRate: 1, nationalizationFees: 0, bankFee: 0 });
    expect(importCostPerUnit(result, 0)).toBe(0);
  });
});

describe("computeCurrencyExposurePct", () => {
  it("calcula el % de costos en moneda distinta a la funcional", () => {
    expect(computeCurrencyExposurePct(10000, 2500)).toBeCloseTo(25);
  });

  it("devuelve 0 si no hay costos totales", () => {
    expect(computeCurrencyExposurePct(0, 0)).toBe(0);
  });
});
