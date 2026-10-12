import { Plus } from "lucide-react";
import { requireCompany } from "@/lib/actions/guard";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShareholderFormDialog } from "@/components/socios/shareholder-form-dialog";
import { CapTableEntryFormDialog } from "@/components/socios/cap-table-entry-form-dialog";
import { CapTableView } from "@/components/socios/cap-table-view";
import { RoundSimulator } from "@/components/socios/round-simulator";
import { ExitWaterfallSimulator } from "@/components/socios/exit-waterfall-simulator";

export default async function SociosPage() {
  const { company } = await requireCompany();

  const [shareholders, entries] = await Promise.all([
    prisma.shareholder.findMany({ where: { companyId: company.id }, orderBy: { createdAt: "asc" } }),
    prisma.capTableEntry.findMany({ where: { companyId: company.id }, orderBy: { createdAt: "asc" } }),
  ]);

  const shareholderById = new Map(shareholders.map((s) => [s.id, s]));

  const currentHoldings = entries.map((e) => ({
    shareholderId: e.shareholderId,
    shareholderName: shareholderById.get(e.shareholderId)?.name ?? "—",
    shares: e.shares,
  }));

  const preferred = entries
    .filter((e) => e.isPreferred)
    .map((e) => ({
      shareholderId: e.shareholderId,
      shareholderName: shareholderById.get(e.shareholderId)?.name ?? "—",
      investedAmount: e.investedAmount,
      liquidationPreferenceMultiple: e.liquidationPreferenceMultiple,
    }));

  const common = entries
    .filter((e) => !e.isPreferred)
    .map((e) => ({
      shareholderId: e.shareholderId,
      shareholderName: shareholderById.get(e.shareholderId)?.name ?? "—",
      shares: e.shares,
    }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Socios / Cap Table</h1>
        <p className="text-sm text-slate-500">Participación accionaria, simulador de rondas y de salida (spec §16.2-16.4).</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">Socios</CardTitle>
              <CardDescription>Fundadores, inversionistas y pool de opciones.</CardDescription>
            </div>
            <ShareholderFormDialog
              trigger={
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Nuevo socio
                </Button>
              }
            />
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">Cap Table</CardTitle>
              <CardDescription>Participación actual, dilución acumulada y preferencias de liquidación.</CardDescription>
            </div>
            {shareholders.length > 0 && (
              <CapTableEntryFormDialog
                shareholders={shareholders}
                trigger={
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                    Nueva participación
                  </Button>
                }
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <CapTableView entries={entries} shareholders={shareholders} currency={company.currency} />
        </CardContent>
      </Card>

      <RoundSimulator currentHoldings={currentHoldings} currency={company.currency} />

      <ExitWaterfallSimulator preferred={preferred} common={common} currency={company.currency} />
    </div>
  );
}
