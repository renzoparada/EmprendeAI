import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BUSINESS_TYPE_LABELS, OPERATING_STAGE_LABELS } from "@/lib/constants";

export default async function AdminEmpresasPage() {
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } }, _count: { select: { products: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Empresas</h1>
        <p className="text-sm text-slate-500">{companies.length} empresa(s) registradas en la plataforma.</p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Dueño</TableHead>
                <TableHead>Rubro</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead className="text-right">Productos</TableHead>
                <TableHead>Moneda</TableHead>
                <TableHead>Creada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-slate-900">{c.name}</TableCell>
                  <TableCell className="text-slate-600">{c.user.name} ({c.user.email})</TableCell>
                  <TableCell>{BUSINESS_TYPE_LABELS[c.businessType]}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{OPERATING_STAGE_LABELS[c.operatingStage]}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{c._count.products}</TableCell>
                  <TableCell>{c.currency}</TableCell>
                  <TableCell className="text-xs text-slate-500">{c.createdAt.toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
