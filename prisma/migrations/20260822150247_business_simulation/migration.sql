-- CreateTable
CREATE TABLE "BusinessSimulation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "horizonMonths" INTEGER NOT NULL DEFAULT 12,
    "monthlySalesGrowthPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priceAdjustmentPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "annualInflationPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "staffCount" INTEGER NOT NULL DEFAULT 0,
    "avgSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyStaffGrowthPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyMarketingGrowthPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "exchangeRateShockPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "includeFinancing" BOOLEAN NOT NULL DEFAULT true,
    "investmentEvents" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSimulation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessSimulation_companyId_idx" ON "BusinessSimulation"("companyId");

-- AddForeignKey
ALTER TABLE "BusinessSimulation" ADD CONSTRAINT "BusinessSimulation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
