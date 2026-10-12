-- CreateEnum
CREATE TYPE "CostOrigin" AS ENUM ('LOCAL', 'IMPORTADO');

-- CreateEnum
CREATE TYPE "ExchangeRateType" AS ENUM ('OFICIAL', 'PARALELO', 'PROYECTADO');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "costOrigin" "CostOrigin" NOT NULL DEFAULT 'LOCAL';

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "rateType" "ExchangeRateType" NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportCost" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "originCurrency" TEXT NOT NULL,
    "fobCost" DOUBLE PRECISION NOT NULL,
    "freight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "insurance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tariffPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nationalizationFees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bankFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportCost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_companyId_fromCurrency_toCurrency_rateType_key" ON "ExchangeRate"("companyId", "fromCurrency", "toCurrency", "rateType");

-- CreateIndex
CREATE INDEX "ImportCost_productId_idx" ON "ImportCost"("productId");

-- AddForeignKey
ALTER TABLE "ExchangeRate" ADD CONSTRAINT "ExchangeRate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportCost" ADD CONSTRAINT "ImportCost_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
