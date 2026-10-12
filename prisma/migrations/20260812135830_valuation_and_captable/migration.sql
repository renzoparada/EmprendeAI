-- CreateEnum
CREATE TYPE "ShareholderType" AS ENUM ('FOUNDER', 'INVERSIONISTA', 'ESOP', 'OTRO');

-- CreateTable
CREATE TABLE "ValuationAssumptions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "riskFreeRatePct" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "beta" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "marketReturnPct" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "costOfDebtPct" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "debtRatioPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fclGrowthPct" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "terminalGrowthPct" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "projectionYears" INTEGER NOT NULL DEFAULT 5,
    "evEbitdaMultiple" DOUBLE PRECISION,
    "evSalesMultiple" DOUBLE PRECISION,
    "peMultiple" DOUBLE PRECISION,
    "berkusFactorCap" DOUBLE PRECISION NOT NULL DEFAULT 500000,
    "berkusIdea" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "berkusPrototype" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "berkusTeam" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "berkusRelationships" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "berkusInitialSales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scorecardComparableAvg" DOUBLE PRECISION,
    "scorecardManagementScorePct" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "scorecardOpportunityScorePct" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "scorecardProductScorePct" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "scorecardCompetitionScorePct" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "scorecardMarketingScorePct" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "scorecardNeedInvestmentScorePct" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "vcExitValueProjected" DOUBLE PRECISION,
    "vcRequiredReturnMultiple" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "vcInvestmentAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValuationAssumptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shareholder" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ShareholderType" NOT NULL DEFAULT 'FOUNDER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shareholder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundingRound" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preMoneyValuation" DOUBLE PRECISION NOT NULL,
    "investmentAmount" DOUBLE PRECISION NOT NULL,
    "pricePerShare" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundingRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapTableEntry" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "shareholderId" TEXT NOT NULL,
    "shares" DOUBLE PRECISION NOT NULL,
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "liquidationPreferenceMultiple" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "investedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fundingRoundId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapTableEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ValuationAssumptions_companyId_key" ON "ValuationAssumptions"("companyId");

-- CreateIndex
CREATE INDEX "Shareholder_companyId_idx" ON "Shareholder"("companyId");

-- CreateIndex
CREATE INDEX "FundingRound_companyId_idx" ON "FundingRound"("companyId");

-- CreateIndex
CREATE INDEX "CapTableEntry_companyId_idx" ON "CapTableEntry"("companyId");

-- CreateIndex
CREATE INDEX "CapTableEntry_shareholderId_idx" ON "CapTableEntry"("shareholderId");

-- AddForeignKey
ALTER TABLE "ValuationAssumptions" ADD CONSTRAINT "ValuationAssumptions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shareholder" ADD CONSTRAINT "Shareholder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundingRound" ADD CONSTRAINT "FundingRound_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapTableEntry" ADD CONSTRAINT "CapTableEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapTableEntry" ADD CONSTRAINT "CapTableEntry_shareholderId_fkey" FOREIGN KEY ("shareholderId") REFERENCES "Shareholder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapTableEntry" ADD CONSTRAINT "CapTableEntry_fundingRoundId_fkey" FOREIGN KEY ("fundingRoundId") REFERENCES "FundingRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;
