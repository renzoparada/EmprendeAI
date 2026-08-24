import { describe, expect, it } from "vitest";
import { buildPriceSalesHeatmap, computeSensitivityRanking, type SensitivityInputs } from "./sensitivity";

const inputs: SensitivityInputs = {
  products: [
    {
      id: "p1",
      name: "Producto A",
      price: 100,
      variableCost: 40,
      unitsSoldMonthly: 200,
      commissionPct: 0,
      taxPct: 0,
      discountPct: 0,
    },
  ],
  fixedCosts: [{ id: "f1", amountMonthly: 6000 }],
  variableCosts: [],
};

describe("computeSensitivityRanking", () => {
  it("ordena las variables por impacto absoluto sobre la utilidad neta", () => {
    const ranking = computeSensitivityRanking(inputs, 25, 10);
    expect(ranking).toHaveLength(4);
    // Debe venir ordenado de mayor a menor impacto absoluto.
    for (let i = 1; i < ranking.length; i++) {
      expect(Math.abs(ranking[i - 1].impactPctOnUtilidad)).toBeGreaterThanOrEqual(Math.abs(ranking[i].impactPctOnUtilidad));
    }
    // Con margen de contribución 60% y costos fijos bajos, precio y ventas
    // deberían pesar más que un shock de 10% en costos fijos.
    const precio = ranking.find((r) => r.variable === "precio")!;
    const costosFijos = ranking.find((r) => r.variable === "costos_fijos")!;
    expect(Math.abs(precio.impactPctOnUtilidad)).toBeGreaterThan(Math.abs(costosFijos.impactPctOnUtilidad));
  });

  it("incluye variables extra (ej. tipo de cambio) en el ranking", () => {
    const ranking = computeSensitivityRanking(inputs, 25, 10, [
      { variable: "tipo_cambio", label: "Tipo de Cambio", impactPctOnUtilidad: 999 },
    ]);
    expect(ranking[0].variable).toBe("tipo_cambio");
  });
});

describe("buildPriceSalesHeatmap", () => {
  it("genera una matriz con la utilidad neta para cada combinación de deltas", () => {
    const heatmap = buildPriceSalesHeatmap(inputs, 25, [-10, 0, 10], [-10, 0, 10]);
    expect(heatmap).toHaveLength(3);
    expect(heatmap[0]).toHaveLength(3);
    // Celda central (sin shocks) debe coincidir con el caso base.
    const centerCell = heatmap[1][1];
    expect(centerCell.priceDeltaPct).toBe(0);
    expect(centerCell.salesDeltaPct).toBe(0);
    // Utilidad debe crecer con precio y ventas más altos (celda [2][2] > [0][0]).
    expect(heatmap[2][2].utilidadNeta).toBeGreaterThan(heatmap[0][0].utilidadNeta);
  });
});
