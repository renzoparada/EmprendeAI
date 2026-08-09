import { Plus } from "lucide-react";
import { requireCompany } from "@/lib/actions/guard";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FixedCostFormDialog } from "@/components/costos/fixed-cost-form-dialog";
import { VariableCostFormDialog } from "@/components/costos/variable-cost-form-dialog";
import { FixedCostsTable } from "@/components/costos/fixed-costs-table";
import { VariableCostsTable } from "@/components/costos/variable-costs-table";

export default async function CostosPage() {
  const { company } = await requireCompany();

  const [fixedCosts, variableCosts, products] = await Promise.all([
    prisma.fixedCost.findMany({ where: { companyId: company.id }, orderBy: { createdAt: "asc" } }),
    prisma.variableCost.findMany({ where: { companyId: company.id }, orderBy: { createdAt: "asc" } }),
    prisma.product.findMany({ where: { companyId: company.id } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Estructura de Costos</h1>
        <p className="text-sm text-slate-500">Costos fijos y variables — clasificados y usados por el motor financiero (spec §4).</p>
      </div>

      <Tabs defaultValue="fijos">
        <TabsList>
          <TabsTrigger value="fijos">Costos Fijos</TabsTrigger>
          <TabsTrigger value="variables">Costos Variables</TabsTrigger>
        </TabsList>
        <TabsContent value="fijos">
          <div className="mb-4 flex justify-end">
            <FixedCostFormDialog
              trigger={
                <Button>
                  <Plus className="h-4 w-4" />
                  Nuevo costo fijo
                </Button>
              }
            />
          </div>
          <FixedCostsTable costs={fixedCosts} currency={company.currency} />
        </TabsContent>
        <TabsContent value="variables">
          <div className="mb-4 flex justify-end">
            <VariableCostFormDialog
              products={products}
              trigger={
                <Button>
                  <Plus className="h-4 w-4" />
                  Nuevo costo variable
                </Button>
              }
            />
          </div>
          <VariableCostsTable costs={variableCosts} products={products} currency={company.currency} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
