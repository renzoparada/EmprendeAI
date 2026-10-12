-- CreateEnum
CREATE TYPE "FinancingType" AS ENUM ('PRESTAMO_BANCARIO', 'SOCIOS', 'INVERSIONISTA', 'CROWDFUNDING', 'CAPITAL_PROPIO');

-- CreateEnum
CREATE TYPE "GraceType" AS ENUM ('NINGUNA', 'SOLO_INTERES', 'TOTAL');

-- CreateTable
CREATE TABLE "FinancingPlan" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FinancingType" NOT NULL DEFAULT 'PRESTAMO_BANCARIO',
    "principal" DOUBLE PRECISION NOT NULL,
    "annualInterestRatePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "termMonths" INTEGER NOT NULL,
    "gracePeriodMonths" INTEGER NOT NULL DEFAULT 0,
    "graceType" "GraceType" NOT NULL DEFAULT 'NINGUNA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinancingPlan_companyId_idx" ON "FinancingPlan"("companyId");

-- AddForeignKey
ALTER TABLE "FinancingPlan" ADD CONSTRAINT "FinancingPlan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
