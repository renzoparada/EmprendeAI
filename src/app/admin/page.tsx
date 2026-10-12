import { prisma } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PlanCode } from "@prisma/client";

export default async function AdminOverviewPage() {
  const [userCount, companyCount, aiMessageCount, usersByPlan, tokenAgg] = await Promise.all([
    prisma.user.count(),
    prisma.company.count(),
    prisma.aIMessage.count({ where: { role: "ASSISTANT" } }),
    prisma.user.groupBy({ by: ["planCode"], _count: { _all: true } }),
    prisma.aIMessage.aggregate({ _sum: { inputTokens: true, outputTokens: true } }),
  ]);

  const planCounts = new Map(usersByPlan.map((row) => [row.planCode, row._count._all]));
  const totalTokens = (tokenAgg._sum.inputTokens ?? 0) + (tokenAgg._sum.outputTokens ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Overview</h1>
        <p className="text-sm text-slate-500">Panel Administrador (spec §25) — usuarios, empresas, planes y uso de IA de toda la plataforma.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-slate-500">Usuarios totales</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{userCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-slate-500">Empresas totales</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{companyCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-slate-500">Respuestas del Chat IA</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{aiMessageCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-slate-500">Tokens de IA consumidos</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{totalTokens.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">Distribución de planes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Usuarios</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Object.keys(PLANS) as PlanCode[]).map((code) => (
                <TableRow key={code}>
                  <TableCell className="font-medium text-slate-900">{PLANS[code].name}</TableCell>
                  <TableCell className="text-right">{planCounts.get(code) ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">Pagos y suscripciones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            No hay una pasarela de pago integrada todavía — los cambios de plan se hacen manualmente desde{" "}
            <span className="font-medium text-slate-700">Usuarios</span>. Cuando se integre un proveedor de pagos, esta
            sección mostrará suscripciones activas, facturación e historial de pagos reales (spec §25).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
