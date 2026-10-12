import { describe, expect, it } from "vitest";
import {
  buildAmortizationSchedule,
  computeCashFlowWithDebtService,
  computeFixedInstallment,
  computeLeveragedRoi,
  computeMonthlyRate,
  summarizeLoan,
} from "./financing";

describe("financing engine", () => {
  it("computeMonthlyRate converts an annual rate to a monthly one", () => {
    expect(computeMonthlyRate(12)).toBeCloseTo(0.01);
  });

  it("computeFixedInstallment matches the standard French amortization formula", () => {
    const monthlyRate = 0.01;
    const cuota = computeFixedInstallment(12000, monthlyRate, 12);
    const expected = (12000 * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -12));
    expect(cuota).toBeCloseTo(expected);
    expect(cuota).toBeCloseTo(1066.19, 2);
  });

  it("computeFixedInstallment splits evenly when the rate is 0", () => {
    expect(computeFixedInstallment(12000, 0, 12)).toBeCloseTo(1000);
  });

  it("buildAmortizationSchedule (sin gracia) amortiza el principal completo y termina en saldo 0", () => {
    const schedule = buildAmortizationSchedule({
      principal: 12000,
      annualInterestRatePct: 12,
      termMonths: 12,
      gracePeriodMonths: 0,
      graceType: "NINGUNA",
    });

    expect(schedule).toHaveLength(12);
    expect(schedule[schedule.length - 1].saldoFinal).toBeCloseTo(0);
    const totalCapital = schedule.reduce((sum, r) => sum + r.capital, 0);
    expect(totalCapital).toBeCloseTo(12000);
    // La cuota debe ser constante en todos los meses (sistema francés, sin gracia).
    for (const row of schedule) {
      expect(row.cuota).toBeCloseTo(schedule[0].cuota, 1);
    }
  });

  it("gracia SOLO_INTERES: el saldo no baja durante la gracia, solo se paga interés", () => {
    const schedule = buildAmortizationSchedule({
      principal: 10000,
      annualInterestRatePct: 12,
      termMonths: 12,
      gracePeriodMonths: 3,
      graceType: "SOLO_INTERES",
    });

    const graceRows = schedule.slice(0, 3);
    for (const row of graceRows) {
      expect(row.capital).toBe(0);
      expect(row.saldoFinal).toBeCloseTo(row.saldoInicial);
      expect(row.cuota).toBeCloseTo(row.interes);
    }
    // Después de la gracia el saldo sigue siendo el principal completo.
    expect(schedule[3].saldoInicial).toBeCloseTo(10000);
    expect(schedule[schedule.length - 1].saldoFinal).toBeCloseTo(0);
  });

  it("gracia TOTAL: el interés se capitaliza y el saldo crece durante la gracia", () => {
    const schedule = buildAmortizationSchedule({
      principal: 10000,
      annualInterestRatePct: 12,
      termMonths: 12,
      gracePeriodMonths: 3,
      graceType: "TOTAL",
    });

    const graceRows = schedule.slice(0, 3);
    for (const row of graceRows) {
      expect(row.cuota).toBe(0);
      expect(row.saldoFinal).toBeGreaterThan(row.saldoInicial);
    }
    expect(schedule[3].saldoInicial).toBeGreaterThan(10000);
    expect(schedule[schedule.length - 1].saldoFinal).toBeCloseTo(0);
  });

  it("summarizeLoan reporta cuota, total pagado e intereses coherentes", () => {
    const schedule = buildAmortizationSchedule({
      principal: 12000,
      annualInterestRatePct: 12,
      termMonths: 12,
      gracePeriodMonths: 0,
      graceType: "NINGUNA",
    });
    const summary = summarizeLoan(schedule);

    expect(summary.cuotaMensual).toBeCloseTo(1066.19, 2);
    expect(summary.totalPagado).toBeCloseTo(summary.cuotaMensual * 12, 1);
    expect(summary.totalIntereses).toBeCloseTo(summary.totalPagado - 12000, 1);
    expect(summary.costoFinancieroTotal).toBeCloseTo(summary.totalIntereses);
  });

  it("summarizeLoan con tasa 0 no reporta intereses", () => {
    const schedule = buildAmortizationSchedule({
      principal: 12000,
      annualInterestRatePct: 0,
      termMonths: 12,
      gracePeriodMonths: 0,
      graceType: "NINGUNA",
    });
    const summary = summarizeLoan(schedule);

    expect(summary.totalIntereses).toBeCloseTo(0);
    expect(summary.cuotaMensual).toBeCloseTo(1000);
  });

  it("computeLeveragedRoi calcula el retorno sobre el capital propio, descontando lo financiado", () => {
    expect(computeLeveragedRoi(1000, 10000, 6000)).toBeCloseTo(25);
  });

  it("computeLeveragedRoi devuelve null si lo financiado cubre o supera la inversión total", () => {
    expect(computeLeveragedRoi(1000, 10000, 10000)).toBeNull();
    expect(computeLeveragedRoi(1000, 10000, 12000)).toBeNull();
  });

  it("computeCashFlowWithDebtService resta el servicio de deuda del flujo operativo", () => {
    expect(computeCashFlowWithDebtService(5000, 1200)).toBeCloseTo(3800);
  });
});
