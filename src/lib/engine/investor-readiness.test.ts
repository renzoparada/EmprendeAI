import { describe, expect, it } from "vitest";
import { computeInvestorReadinessScore } from "./investor-readiness";

describe("computeInvestorReadinessScore (16.5)", () => {
  it("da el puntaje máximo con todas las señales positivas", () => {
    const result = computeInvestorReadinessScore({
      hasProducts: true,
      hasCosts: true,
      hasInvestment: true,
      marginNetoPct: 25,
      cashFlowPositive: true,
      hasProductConcentrationRisk: false,
      activeRiskCount: 0,
    });
    expect(result.score).toBe(100);
  });

  it("da 0 cuando no hay ningún dato cargado", () => {
    const result = computeInvestorReadinessScore({
      hasProducts: false,
      hasCosts: false,
      hasInvestment: false,
      marginNetoPct: null,
      cashFlowPositive: null,
      hasProductConcentrationRisk: false,
      activeRiskCount: 0,
    });
    expect(result.score).toBe(0);
  });

  it("penaliza flujo de caja negativo y riesgos activos", () => {
    const healthy = computeInvestorReadinessScore({
      hasProducts: true,
      hasCosts: true,
      hasInvestment: true,
      marginNetoPct: 20,
      cashFlowPositive: true,
      hasProductConcentrationRisk: false,
      activeRiskCount: 0,
    });
    const risky = computeInvestorReadinessScore({
      hasProducts: true,
      hasCosts: true,
      hasInvestment: true,
      marginNetoPct: 20,
      cashFlowPositive: false,
      hasProductConcentrationRisk: true,
      activeRiskCount: 3,
    });
    expect(risky.score).toBeLessThan(healthy.score);
  });

  it("el puntaje nunca sale del rango 0-100", () => {
    const result = computeInvestorReadinessScore({
      hasProducts: true,
      hasCosts: true,
      hasInvestment: true,
      marginNetoPct: 500,
      cashFlowPositive: true,
      hasProductConcentrationRisk: false,
      activeRiskCount: 0,
    });
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
