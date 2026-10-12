import { describe, expect, it } from "vitest";
import { projectWithGrowth } from "./projection";

describe("projectWithGrowth", () => {
  it("proyecta valores creciendo a una tasa compuesta anual", () => {
    const values = projectWithGrowth(1000, 10, 3);
    expect(values).toHaveLength(3);
    expect(values[0]).toBeCloseTo(1100);
    expect(values[1]).toBeCloseTo(1210);
    expect(values[2]).toBeCloseTo(1331);
  });

  it("con crecimiento 0% repite el valor base", () => {
    const values = projectWithGrowth(500, 0, 4);
    expect(values.every((v) => v === 500)).toBe(true);
  });
});
