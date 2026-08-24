import { describe, expect, it } from "vitest";
import {
  computeCAC,
  computeCostPerLead,
  computeExpectedSales,
  computeFunnelConversions,
  computeLTV,
  computeLtvCacRatio,
  computeOverallConversionPct,
  type FunnelStages,
} from "./funnel";

const stages: FunnelStages = {
  leads: 1000,
  contactos: 600,
  prospectos: 300,
  reuniones: 150,
  cotizaciones: 100,
  negociaciones: 60,
  ventas: 40,
};

describe("computeFunnelConversions", () => {
  it("calcula la conversión etapa a etapa", () => {
    const conversions = computeFunnelConversions(stages);
    expect(conversions).toHaveLength(6);
    expect(conversions[0]).toMatchObject({ fromStage: "Leads", toStage: "Contactos", conversionPct: 60 });
    expect(conversions[5].fromStage).toBe("Negociaciones");
    expect(conversions[5].toStage).toBe("Ventas");
    expect(conversions[5].conversionPct).toBeCloseTo((40 / 60) * 100);
  });

  it("no divide por cero si una etapa está vacía", () => {
    const conversions = computeFunnelConversions({ ...stages, leads: 0 });
    expect(conversions[0].conversionPct).toBe(0);
  });
});

describe("computeOverallConversionPct", () => {
  it("calcula la conversión global leads -> ventas", () => {
    expect(computeOverallConversionPct(stages)).toBeCloseTo(4);
  });
});

describe("computeCostPerLead y computeCAC (21.12)", () => {
  it("calcula costo por lead y CAC", () => {
    expect(computeCostPerLead(5000, 1000)).toBeCloseTo(5);
    expect(computeCAC(5000, 40)).toBeCloseTo(125);
  });
});

describe("computeLTV y computeLtvCacRatio (21.12)", () => {
  it("calcula LTV y la relación LTV/CAC", () => {
    const ltv = computeLTV(200, 4, 3); // ticket 200, 4 compras/año, 3 años
    expect(ltv).toBeCloseTo(2400);

    const result = computeLtvCacRatio(ltv, 125);
    expect(result.ratio).toBeCloseTo(19.2);
    expect(result.healthy).toBe(true);
  });

  it("marca la relación como no saludable si LTV/CAC < 3", () => {
    const result = computeLtvCacRatio(300, 150);
    expect(result.ratio).toBe(2);
    expect(result.healthy).toBe(false);
  });
});

describe("computeExpectedSales", () => {
  it("proyecta ventas esperadas a partir de leads y conversión global", () => {
    expect(computeExpectedSales(1000, 4)).toBeCloseTo(40);
  });
});
