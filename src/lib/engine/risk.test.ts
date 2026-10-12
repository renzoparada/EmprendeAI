import { describe, expect, it } from "vitest";
import { buildCompanySnapshot, type EngineFixedCost, type EngineProduct } from "./financial";
import { computeRiskMatrix, deriveRiskLevel } from "./risk";

describe("deriveRiskLevel", () => {
  it("combina probabilidad e impacto en una matriz 3x3", () => {
    expect(deriveRiskLevel("baja", "bajo")).toBe("bajo");
    expect(deriveRiskLevel("media", "medio")).toBe("medio");
    expect(deriveRiskLevel("alta", "alto")).toBe("alto");
    expect(deriveRiskLevel("alta", "bajo")).toBe("medio");
  });

  it("clasifica como bajo cuando probabilidad e impacto son ambos bajos", () => {
    expect(deriveRiskLevel("baja", "medio")).toBe("bajo");
  });
});

describe("computeRiskMatrix", () => {
  it("no devuelve riesgos sin datos cargados", () => {
    expect(computeRiskMatrix({ hasData: false, snapshot: null, inversionTotal: 0 })).toEqual([]);
  });

  it("detecta flujo de caja negativo y ventas bajo el punto de equilibrio", () => {
    const products: EngineProduct[] = [
      { id: "p1", name: "A", price: 20, variableCost: 15, unitsSoldMonthly: 50, commissionPct: 0, taxPct: 0, discountPct: 0 },
    ];
    const fixedCosts: EngineFixedCost[] = [{ id: "f1", amountMonthly: 5000 }];
    const snapshot = buildCompanySnapshot(products, [], fixedCosts, 25);

    const risks = computeRiskMatrix({ hasData: true, snapshot, inversionTotal: 0 });
    const ids = risks.map((r) => r.id);
    expect(ids).toContain("flujo_negativo");
    expect(ids).toContain("bajo_punto_equilibrio");
    expect(ids).toContain("margen_bajo");
  });

  it("no marca riesgos cuando el negocio está sano", () => {
    const products: EngineProduct[] = [
      { id: "p1", name: "A", price: 100, variableCost: 30, unitsSoldMonthly: 500, commissionPct: 0, taxPct: 0, discountPct: 0 },
      { id: "p2", name: "B", price: 80, variableCost: 25, unitsSoldMonthly: 400, commissionPct: 0, taxPct: 0, discountPct: 0 },
    ];
    const fixedCosts: EngineFixedCost[] = [{ id: "f1", amountMonthly: 8000 }];
    const snapshot = buildCompanySnapshot(products, [], fixedCosts, 25);

    const risks = computeRiskMatrix({ hasData: true, snapshot, inversionTotal: 10000 });
    expect(risks.find((r) => r.id === "flujo_negativo")).toBeUndefined();
    expect(risks.find((r) => r.id === "bajo_punto_equilibrio")).toBeUndefined();
    expect(risks.find((r) => r.id === "margen_bajo")).toBeUndefined();
  });

  it("detecta concentración cuando un producto domina la contribución marginal", () => {
    const products: EngineProduct[] = [
      { id: "p1", name: "Dominante", price: 100, variableCost: 20, unitsSoldMonthly: 1000, commissionPct: 0, taxPct: 0, discountPct: 0 },
      { id: "p2", name: "Chico", price: 50, variableCost: 45, unitsSoldMonthly: 10, commissionPct: 0, taxPct: 0, discountPct: 0 },
    ];
    const fixedCosts: EngineFixedCost[] = [{ id: "f1", amountMonthly: 1000 }];
    const snapshot = buildCompanySnapshot(products, [], fixedCosts, 25);

    const risks = computeRiskMatrix({ hasData: true, snapshot, inversionTotal: 0 });
    expect(risks.find((r) => r.id === "concentracion_producto")).toBeDefined();
  });
});
