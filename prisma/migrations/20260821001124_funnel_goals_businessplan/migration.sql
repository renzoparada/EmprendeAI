-- CreateEnum
CREATE TYPE "GoalTargetType" AS ENUM ('UTILIDAD_NETA', 'VENTAS');

-- CreateEnum
CREATE TYPE "BusinessPlanSectionKey" AS ENUM ('RESUMEN_EJECUTIVO', 'PROBLEMA', 'SOLUCION', 'PRODUCTO', 'MERCADO', 'CLIENTE_OBJETIVO', 'MODELO_NEGOCIO', 'COMPETENCIA', 'MARKETING', 'VENTAS', 'OPERACIONES', 'EQUIPO', 'ESTRATEGIA');

-- CreateTable
CREATE TABLE "SalesFunnel" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "leads" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contactos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prospectos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reuniones" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cotizaciones" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "negociaciones" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ventas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgTicket" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "marketingSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "purchaseFrequencyPerYear" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "customerLifetimeYears" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesFunnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "targetType" "GoalTargetType" NOT NULL DEFAULT 'UTILIDAD_NETA',
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "targetConversionPct" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "leadsPerVendedor" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "unitsPerCustomer" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessPlanSection" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "key" "BusinessPlanSectionKey" NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessPlanSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesFunnel_companyId_key" ON "SalesFunnel"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Goal_companyId_key" ON "Goal"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessPlanSection_companyId_key_key" ON "BusinessPlanSection"("companyId", "key");

-- AddForeignKey
ALTER TABLE "SalesFunnel" ADD CONSTRAINT "SalesFunnel_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPlanSection" ADD CONSTRAINT "BusinessPlanSection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
