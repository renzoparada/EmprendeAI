/**
 * Datos demo para desarrollo local. Crea un usuario, una empresa (cafetería)
 * con productos, costos fijos/variables, inversión inicial y los tres
 * escenarios por defecto — suficiente para ver el Dashboard y Escenarios con
 * datos reales sin tener que cargarlos a mano.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_SCENARIO_DELTAS } from "../src/lib/engine/scenarios";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@emprendeai.com";
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name: "Usuario Demo", email, passwordHash, planCode: "STARTER" },
  });

  // Usuario administrador para probar el Panel Admin (spec §25) — sin
  // empresa propia, solo acceso a /admin.
  const adminEmail = "admin@emprendeai.com";
  const adminPasswordHash = await bcrypt.hash("admin1234", 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: { name: "Admin EMPRENDE AI", email: adminEmail, passwordHash: adminPasswordHash, planCode: "BUSINESS", role: "ADMIN" },
  });

  console.log(`Admin: ${adminEmail} / admin1234 (sin empresa propia, entra directo a /admin)`);

  const existingCompany = await prisma.company.findFirst({ where: { userId: user.id } });
  if (existingCompany) {
    console.log("La empresa demo ya existe, no se vuelve a crear.");
    return;
  }

  const company = await prisma.company.create({
    data: {
      userId: user.id,
      name: "Café Andino",
      country: "Bolivia",
      city: "La Paz",
      currency: "BOB",
      sector: "Alimentos y bebidas",
      userType: "EMPRENDEDOR",
      businessType: "RESTAURANTE",
      startDate: new Date("2024-01-15"),
      employeeCount: 4,
      operatingStage: "OPERANDO",
      taxRatePct: 25,
      onboardingCompletedAt: new Date(),
    },
  });

  const [espresso, sandwich, torta] = await Promise.all([
    prisma.product.create({
      data: {
        companyId: company.id,
        name: "Café espresso",
        category: "Bebidas",
        type: "PRODUCTO",
        price: 15,
        variableCost: 4,
        unitsSoldMonthly: 1200,
        commissionPct: 0,
        taxPct: 0,
        discountPct: 0,
      },
    }),
    prisma.product.create({
      data: {
        companyId: company.id,
        name: "Sándwich del día",
        category: "Comida",
        type: "PRODUCTO",
        price: 28,
        variableCost: 14,
        unitsSoldMonthly: 500,
        commissionPct: 0,
        taxPct: 0,
        discountPct: 5,
      },
    }),
    prisma.product.create({
      data: {
        companyId: company.id,
        name: "Torta de chocolate (porción)",
        category: "Postres",
        type: "PRODUCTO",
        price: 20,
        variableCost: 7,
        unitsSoldMonthly: 300,
        commissionPct: 0,
        taxPct: 0,
        discountPct: 0,
      },
    }),
  ]);

  await prisma.fixedCost.createMany({
    data: [
      { companyId: company.id, name: "Alquiler local", category: "ALQUILER", amount: 6000, periodicity: "MENSUAL", growthPct: 3 },
      { companyId: company.id, name: "Sueldos equipo", category: "SUELDOS", amount: 12000, periodicity: "MENSUAL", growthPct: 5 },
      { companyId: company.id, name: "Servicios (luz, agua, internet)", category: "SERVICIOS", amount: 1200, periodicity: "MENSUAL", growthPct: 2 },
      { companyId: company.id, name: "Software POS + contabilidad", category: "SOFTWARE", amount: 450, periodicity: "MENSUAL", growthPct: 0 },
      { companyId: company.id, name: "Marketing local", category: "MARKETING", amount: 800, periodicity: "MENSUAL", growthPct: 0 },
    ],
  });

  await prisma.variableCost.createMany({
    data: [
      { companyId: company.id, name: "Empaque/desechables", category: "EMPAQUE", pctOfSales: 2, productId: null },
      { companyId: company.id, name: "Comisión pasarela de pago", category: "TRANSACCION", pctOfSales: 3, productId: null },
      { companyId: company.id, name: "Insumos extra sándwich", category: "MATERIA_PRIMA", amountPerUnit: 1.5, productId: sandwich.id },
    ],
  });

  // Datos históricos precio/cantidad del espresso, para que la curva de
  // demanda y la elasticidad (spec §6) tengan algo que mostrar de entrada.
  await prisma.pricePoint.createMany({
    data: [
      { productId: espresso.id, price: 12, quantity: 1500, recordedAt: new Date("2025-05-01") },
      { productId: espresso.id, price: 15, quantity: 1200, recordedAt: new Date("2025-06-01") },
      { productId: espresso.id, price: 18, quantity: 950, recordedAt: new Date("2025-07-01") },
    ],
  });

  await prisma.investment.createMany({
    data: [
      { companyId: company.id, category: "EQUIPAMIENTO", name: "Máquina de espresso profesional", amount: 25000 },
      { companyId: company.id, category: "MOBILIARIO", name: "Mesas y sillas", amount: 12000 },
      { companyId: company.id, category: "GASTOS_PREOPERATIVOS", name: "Habilitación y permisos", amount: 3000 },
      { companyId: company.id, category: "CAPITAL_DE_TRABAJO", name: "Capital de trabajo inicial (3 meses)", amount: 20000 },
    ],
  });

  await prisma.scenario.createMany({
    data: (Object.keys(DEFAULT_SCENARIO_DELTAS) as (keyof typeof DEFAULT_SCENARIO_DELTAS)[]).map((type) => ({
      companyId: company.id,
      type,
      ...DEFAULT_SCENARIO_DELTAS[type],
    })),
  });

  console.log("Seed completo:");
  console.log(`  Usuario: ${email} / demo1234`);
  console.log(`  Empresa: ${company.name}`);
  console.log(`  Productos: ${[espresso, sandwich, torta].map((p) => p.name).join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
