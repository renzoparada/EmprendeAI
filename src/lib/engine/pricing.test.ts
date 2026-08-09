import { describe, expect, it } from "vitest";
import {
  breakEvenPrice,
  buildPriceCurveSeries,
  computeElasticity,
  fitLinearDemandCurve,
  minPrice,
  profitMaximizingPrice,
  psychologicalPrice,
  revenueMaximizingPrice,
  targetPrice,
  type DemandPoint,
} from "./pricing";

// Curva de demanda "perfecta" para tests: Q = 200 - 4P (sin ruido), para que
// la regresión recupere exactamente los coeficientes conocidos.
const PERFECT_POINTS: DemandPoint[] = [
  { price: 10, quantity: 160 },
  { price: 20, quantity: 120 },
  { price: 30, quantity: 80 },
  { price: 40, quantity: 40 },
];

describe("fitLinearDemandCurve", () => {
  it("devuelve null con menos de 2 puntos", () => {
    expect(fitLinearDemandCurve([])).toBeNull();
    expect(fitLinearDemandCurve([{ price: 10, quantity: 100 }])).toBeNull();
  });

  it("devuelve null si todos los precios son iguales (sin variación)", () => {
    expect(
      fitLinearDemandCurve([
        { price: 10, quantity: 100 },
        { price: 10, quantity: 90 },
      ])
    ).toBeNull();
  });

  it("ajusta correctamente una curva lineal sin ruido", () => {
    const curve = fitLinearDemandCurve(PERFECT_POINTS)!;
    expect(curve).not.toBeNull();
    expect(curve.slope).toBeCloseTo(-4);
    expect(curve.intercept).toBeCloseTo(200);
    expect(curve.rSquared).toBeCloseTo(1);
  });
});

describe("computeElasticity (21.11)", () => {
  const curve = fitLinearDemandCurve(PERFECT_POINTS)!;

  it("clasifica como elástica cuando E < -1", () => {
    // En P=30, Q=80: E = slope * P/Q = -4 * 30/80 = -1.5
    const elasticity = computeElasticity(curve, 30, 80);
    expect(elasticity.value).toBeCloseTo(-1.5);
    expect(elasticity.classification).toBe("elastica");
  });

  it("clasifica como inelástica cuando -1 < E < 0", () => {
    // En P=10, Q=160: E = -4 * 10/160 = -0.25
    const elasticity = computeElasticity(curve, 10, 160);
    expect(elasticity.value).toBeCloseTo(-0.25);
    expect(elasticity.classification).toBe("inelastica");
  });
});

describe("Precios calculados (§6)", () => {
  it("precio mínimo = costo variable unitario", () => {
    expect(minPrice(40)).toBe(40);
  });

  it("precio de equilibrio cubre costo variable + costos fijos prorrateados", () => {
    // 40 + 8000/200 = 80
    expect(breakEvenPrice(40, 8000, 200)).toBeCloseTo(80);
  });

  it("precio objetivo logra el margen % pedido", () => {
    const price = targetPrice(40, 50); // margen 50% -> P = 40 / 0.5 = 80
    expect(price).toBeCloseTo(80);
    // Verificación: (P - c) / P = margen
    expect(((price - 40) / price) * 100).toBeCloseTo(50);
  });

  it("precio óptimo de ingresos maximiza P × Q", () => {
    const curve = fitLinearDemandCurve(PERFECT_POINTS)!;
    const optimalPrice = revenueMaximizingPrice(curve)!;
    // Q = 200 - 4P; ingresos = P(200-4P); máximo en P = 200/8 = 25
    expect(optimalPrice).toBeCloseTo(25);

    const series = buildPriceCurveSeries(curve, 0, { min: 0, max: 50, steps: 501 });
    const revenues = series.map((p) => p.revenue);
    const maxRevenueIndex = revenues.indexOf(Math.max(...revenues));
    expect(series[maxRevenueIndex].price).toBeCloseTo(25, 0);
  });

  it("precio óptimo de utilidad maximiza (P - c) × Q", () => {
    const curve = fitLinearDemandCurve(PERFECT_POINTS)!;
    const unitVariableCost = 10;
    const optimalPrice = profitMaximizingPrice(curve, unitVariableCost)!;
    // Utilidad = (P-10)(200-4P); derivada: 200-4P-4(P-10)=0 -> 240-8P=0 -> P=30
    expect(optimalPrice).toBeCloseTo(30);
  });

  it("precio psicológico termina en .90", () => {
    expect(psychologicalPrice(25.4)).toBeCloseTo(24.9);
    expect(psychologicalPrice(25.6)).toBeCloseTo(25.9);
  });
});
