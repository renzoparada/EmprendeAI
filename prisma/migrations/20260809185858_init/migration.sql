-- CreateEnum
CREATE TYPE "PlanCode" AS ENUM ('FREE', 'STARTER', 'PRO', 'BUSINESS', 'CONSULTOR');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('EMPRENDEDOR', 'PROFESIONAL_INDEPENDIENTE', 'STARTUP', 'PYME', 'EMPRESA_ESTABLECIDA', 'FRANQUICIA', 'INVERSIONISTA');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('RESTAURANTE', 'HOTEL', 'TURISMO', 'COMERCIO', 'ECOMMERCE', 'SERVICIOS', 'CONSULTORIA', 'EDUCACION', 'INMOBILIARIO', 'MANUFACTURA', 'TECNOLOGIA', 'SALUD', 'BELLEZA', 'TRANSPORTE', 'AGRICULTURA', 'OTRO');

-- CreateEnum
CREATE TYPE "OperatingStage" AS ENUM ('OPERANDO', 'NO_OPERANDO', 'ETAPA_IDEA');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('PRODUCTO', 'SERVICIO');

-- CreateEnum
CREATE TYPE "CostPeriodicity" AS ENUM ('MENSUAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "FixedCostCategory" AS ENUM ('ALQUILER', 'SUELDOS', 'SERVICIOS', 'SOFTWARE', 'SEGUROS', 'ADMINISTRACION', 'MARKETING', 'OTROS');

-- CreateEnum
CREATE TYPE "VariableCostCategory" AS ENUM ('MATERIA_PRIMA', 'COMISIONES', 'EMPAQUE', 'TRANSPORTE', 'PRODUCCION', 'TRANSACCION', 'OTROS');

-- CreateEnum
CREATE TYPE "InvestmentCategory" AS ENUM ('EQUIPAMIENTO', 'INFRAESTRUCTURA', 'TECNOLOGIA', 'MOBILIARIO', 'VEHICULOS', 'LICENCIAS', 'MARKETING_INICIAL', 'CAPITAL_DE_TRABAJO', 'GASTOS_PREOPERATIVOS', 'OTROS');

-- CreateEnum
CREATE TYPE "ScenarioType" AS ENUM ('PESIMISTA', 'BASE', 'OPTIMISTA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "planCode" "PlanCode" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BOB',
    "sector" TEXT,
    "userType" "UserType" NOT NULL,
    "businessType" "BusinessType" NOT NULL,
    "startDate" TIMESTAMP(3),
    "employeeCount" INTEGER,
    "operatingStage" "OperatingStage" NOT NULL,
    "taxRatePct" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "onboardingCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "type" "ProductType" NOT NULL DEFAULT 'PRODUCTO',
    "price" DOUBLE PRECISION NOT NULL,
    "variableCost" DOUBLE PRECISION NOT NULL,
    "unitsSoldMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commissionPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixedCost" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "FixedCostCategory" NOT NULL DEFAULT 'OTROS',
    "amount" DOUBLE PRECISION NOT NULL,
    "periodicity" "CostPeriodicity" NOT NULL DEFAULT 'MENSUAL',
    "growthPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FixedCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariableCost" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "VariableCostCategory" NOT NULL DEFAULT 'OTROS',
    "amountPerUnit" DOUBLE PRECISION,
    "pctOfSales" DOUBLE PRECISION,
    "productId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VariableCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "category" "InvestmentCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "ScenarioType" NOT NULL,
    "salesDeltaPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priceDeltaPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costDeltaPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Company_userId_idx" ON "Company"("userId");

-- CreateIndex
CREATE INDEX "Product_companyId_idx" ON "Product"("companyId");

-- CreateIndex
CREATE INDEX "FixedCost_companyId_idx" ON "FixedCost"("companyId");

-- CreateIndex
CREATE INDEX "VariableCost_companyId_idx" ON "VariableCost"("companyId");

-- CreateIndex
CREATE INDEX "VariableCost_productId_idx" ON "VariableCost"("productId");

-- CreateIndex
CREATE INDEX "Investment_companyId_idx" ON "Investment"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Scenario_companyId_type_key" ON "Scenario"("companyId", "type");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedCost" ADD CONSTRAINT "FixedCost_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariableCost" ADD CONSTRAINT "VariableCost_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariableCost" ADD CONSTRAINT "VariableCost_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scenario" ADD CONSTRAINT "Scenario_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
