-- CreateEnum
CREATE TYPE "SnapshotSource" AS ENUM ('AUTOMATICO', 'MANUAL');

-- CreateTable
CREATE TABLE "MonthlySnapshot" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "ventas" DOUBLE PRECISION NOT NULL,
    "costoVentas" DOUBLE PRECISION NOT NULL,
    "utilidadBruta" DOUBLE PRECISION NOT NULL,
    "gastosOperativos" DOUBLE PRECISION NOT NULL,
    "ebitda" DOUBLE PRECISION NOT NULL,
    "utilidadNeta" DOUBLE PRECISION NOT NULL,
    "margenNetoPct" DOUBLE PRECISION NOT NULL,
    "flujoNeto" DOUBLE PRECISION NOT NULL,
    "breakEvenAmount" DOUBLE PRECISION NOT NULL,
    "source" "SnapshotSource" NOT NULL DEFAULT 'AUTOMATICO',
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonthlySnapshot_companyId_idx" ON "MonthlySnapshot"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlySnapshot_companyId_periodYear_periodMonth_key" ON "MonthlySnapshot"("companyId", "periodYear", "periodMonth");

-- AddForeignKey
ALTER TABLE "MonthlySnapshot" ADD CONSTRAINT "MonthlySnapshot_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
