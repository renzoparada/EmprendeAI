import { describe, expect, it } from "vitest";
import { computeExitWaterfall, computeOwnershipPct, computePricePerShare, simulateFundingRound } from "./captable";

describe("computeOwnershipPct y computePricePerShare (21.9)", () => {
  it("calcula % de participación", () => {
    expect(computeOwnershipPct(300, 1000)).toBeCloseTo(30);
    expect(computeOwnershipPct(0, 0)).toBe(0);
  });

  it("calcula precio por acción desde la valoración pre-money", () => {
    // 900000 / 900 acciones = 1000/acción
    expect(computePricePerShare(900000, 900)).toBeCloseTo(1000);
  });
});

describe("simulateFundingRound (16.3/21.9)", () => {
  it("calcula post-money, acciones nuevas y dilución de los socios existentes", () => {
    const result = simulateFundingRound({
      currentHoldings: [
        { shareholderId: "founder1", shareholderName: "Founder 1", shares: 700 },
        { shareholderId: "founder2", shareholderName: "Founder 2", shares: 300 },
      ],
      preMoneyValuation: 1000000,
      investmentAmount: 250000,
      newInvestorName: "Fondo XYZ",
    });

    // precio/acción = 1000000/1000 = 1000; nuevas acciones = 250000/1000=250
    expect(result.pricePerShare).toBeCloseTo(1000);
    expect(result.newSharesIssued).toBeCloseTo(250);
    expect(result.postMoneyValuation).toBeCloseTo(1250000);
    expect(result.totalSharesAfter).toBeCloseTo(1250);

    const founder1 = result.holdings.find((h) => h.shareholderId === "founder1")!;
    expect(founder1.pctBefore).toBeCloseTo(70);
    expect(founder1.pctAfter).toBeCloseTo(56); // 700/1250
    expect(founder1.dilutionPct).toBeCloseTo(14);

    const investor = result.holdings.find((h) => h.isNewInvestor)!;
    expect(investor.pctAfter).toBeCloseTo(20); // 250/1250
  });
});

describe("computeExitWaterfall (16.4/21.10)", () => {
  it("paga deuda, luego preferencia de liquidación, luego reparte el remanente pro-rata", () => {
    const result = computeExitWaterfall(
      1000000,
      100000,
      [{ shareholderId: "inv1", shareholderName: "Inversionista 1", investedAmount: 200000, liquidationPreferenceMultiple: 1 }],
      [
        { shareholderId: "founder1", shareholderName: "Founder 1", shares: 700 },
        { shareholderId: "founder2", shareholderName: "Founder 2", shares: 300 },
      ]
    );

    expect(result.debtPayment).toBe(100000);
    expect(result.preferredDistribution[0].amount).toBe(200000);
    // Remanente = 1000000 - 100000 - 200000 = 700000, repartido 70/30
    expect(result.commonDistribution.find((d) => d.shareholderId === "founder1")!.amount).toBeCloseTo(490000);
    expect(result.commonDistribution.find((d) => d.shareholderId === "founder2")!.amount).toBeCloseTo(210000);
    expect(result.remainderUndistributed).toBeCloseTo(0);
  });

  it("no paga más de lo disponible si el precio de salida es bajo", () => {
    const result = computeExitWaterfall(
      50000,
      100000,
      [{ shareholderId: "inv1", shareholderName: "Inversionista 1", investedAmount: 200000, liquidationPreferenceMultiple: 1 }],
      [{ shareholderId: "founder1", shareholderName: "Founder 1", shares: 100 }]
    );

    expect(result.debtPayment).toBe(50000);
    expect(result.preferredDistribution[0].amount).toBe(0);
    expect(result.commonDistribution[0].amount).toBe(0);
  });
});
