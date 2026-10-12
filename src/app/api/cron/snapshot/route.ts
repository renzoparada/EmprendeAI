import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildCompanySnapshot } from "@/lib/engine/financial";
import { ensureCurrentMonthSnapshot } from "@/lib/actions/snapshot-actions";
import { toEngineFixedCosts, toEngineProducts, toEngineVariableCosts } from "@/lib/mappers";

export const runtime = "nodejs";

/**
 * Captura de fin de mes vía cron externo — OPCIONAL (diseño "Benchmarking
 * Temporal", spec §20/§13). La plataforma funciona sin este endpoint: la
 * captura perezosa al abrir el Dashboard (`ensureCurrentMonthSnapshot`) ya
 * garantiza una foto por mes calendario. Este endpoint solo sirve si se
 * configura un cron real externo (ej. Vercel Cron, GitHub Actions) apuntando
 * aquí a fin de mes, para una foto de "fin de mes" más precisa que "cuando
 * alguien entró a la app". Protegido con `CRON_SECRET` — deshabilitado
 * (501) si no está configurado, nunca corre sin autenticar.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET no configurado — este endpoint está deshabilitado." }, { status: 501 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const companies = await prisma.company.findMany({ select: { id: true, taxRatePct: true } });

  let captured = 0;
  let skipped = 0;

  for (const company of companies) {
    const [products, fixedCosts, variableCosts] = await Promise.all([
      prisma.product.findMany({ where: { companyId: company.id } }),
      prisma.fixedCost.findMany({ where: { companyId: company.id } }),
      prisma.variableCost.findMany({ where: { companyId: company.id } }),
    ]);

    const hasData = products.length > 0;
    if (!hasData) {
      skipped++;
      continue;
    }

    const snapshot = buildCompanySnapshot(
      toEngineProducts(products),
      toEngineVariableCosts(variableCosts),
      toEngineFixedCosts(fixedCosts),
      company.taxRatePct
    );

    const before = await prisma.monthlySnapshot.count({ where: { companyId: company.id } });
    await ensureCurrentMonthSnapshot(company.id, hasData, snapshot);
    const after = await prisma.monthlySnapshot.count({ where: { companyId: company.id } });
    if (after > before) captured++;
    else skipped++;
  }

  return NextResponse.json({ companies: companies.length, captured, skipped });
}
