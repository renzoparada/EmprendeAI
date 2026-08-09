import { Plus } from "lucide-react";
import { requireCompany } from "@/lib/actions/guard";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ProductFormDialog } from "@/components/mi-negocio/product-form-dialog";
import { ProductsTable } from "@/components/mi-negocio/products-table";

export default async function MiNegocioPage() {
  const { company } = await requireCompany();

  const [products, variableCosts] = await Promise.all([
    prisma.product.findMany({ where: { companyId: company.id }, orderBy: { createdAt: "asc" } }),
    prisma.variableCost.findMany({ where: { companyId: company.id } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Mi Negocio</h1>
          <p className="text-sm text-slate-500">
            Productos y servicios — el margen y la contribución marginal se calculan automáticamente (spec §3).
          </p>
        </div>
        <ProductFormDialog
          currency={company.currency}
          trigger={
            <Button>
              <Plus className="h-4 w-4" />
              Nuevo producto/servicio
            </Button>
          }
        />
      </div>
      <ProductsTable products={products} variableCosts={variableCosts} currency={company.currency} />
    </div>
  );
}
