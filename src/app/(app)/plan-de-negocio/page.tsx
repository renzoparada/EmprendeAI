import { requireCompany } from "@/lib/actions/guard";
import { prisma } from "@/lib/db";
import { buildCompanySnapshot, totalInvestment } from "@/lib/engine/financial";
import { projectWithGrowth } from "@/lib/engine/projection";
import { computeRiskMatrix } from "@/lib/engine/risk";
import { toEngineFixedCosts, toEngineProducts, toEngineVariableCosts } from "@/lib/mappers";
import { BUSINESS_PLAN_SECTION_LABELS, BUSINESS_PLAN_SECTION_ORDER } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SectionEditor } from "@/components/plan-de-negocio/section-editor";
import { InvestmentsTable } from "@/components/inversion/investments-table";
import { RiskMatrixTable } from "@/components/sensibilidad/risk-matrix-table";
import { ProjectionChart, type ProjectionPoint } from "@/components/inversionistas/projection-chart";
import { formatCurrency } from "@/lib/utils";

const PROJECTION_YEARS = 5;
const DEFAULT_ANNUAL_GROWTH_PCT = 5;

const SECTION_DESCRIPTIONS: Record<string, string> = {
  RESUMEN_EJECUTIVO: "Qué hace el negocio, a quién sirve y por qué es una oportunidad — en un párrafo.",
  PROBLEMA: "El problema o necesidad concreta que resuelves.",
  SOLUCION: "Cómo tu producto/servicio resuelve ese problema.",
  PRODUCTO: "Descripción de tu producto o servicio principal.",
  MERCADO: "Tamaño y características del mercado al que apuntas.",
  CLIENTE_OBJETIVO: "Perfil del cliente objetivo: segmento, necesidades.",
  MODELO_NEGOCIO: "Cómo genera ingresos el negocio.",
  COMPETENCIA: "Cómo te posicionas frente a la competencia.",
  MARKETING: "Cómo vas a atraer y convertir clientes.",
  VENTAS: "Cómo funciona tu proceso de ventas.",
  OPERACIONES: "Cómo opera el negocio día a día.",
  EQUIPO: "Quién forma parte del equipo fundador.",
  ESTRATEGIA: "Prioridades estratégicas de corto plazo.",
};

export default async function PlanDeNegocioPage() {
  const { company } = await requireCompany();

  const [sections, products, fixedCosts, variableCosts, investments] = await Promise.all([
    prisma.businessPlanSection.findMany({ where: { companyId: company.id } }),
    prisma.product.findMany({ where: { companyId: company.id } }),
    prisma.fixedCost.findMany({ where: { companyId: company.id } }),
    prisma.variableCost.findMany({ where: { companyId: company.id } }),
    prisma.investment.findMany({ where: { companyId: company.id }, orderBy: { createdAt: "asc" } }),
  ]);

  const contentByKey = new Map(sections.map((s) => [s.key, s.content]));

  const engineProducts = toEngineProducts(products);
  const engineFixedCosts = toEngineFixedCosts(fixedCosts);
  const engineVariableCosts = toEngineVariableCosts(variableCosts);
  const hasData = products.length > 0;

  const snapshot = buildCompanySnapshot(engineProducts, engineVariableCosts, engineFixedCosts, company.taxRatePct);
  const inversionTotal = totalInvestment(investments.map((i) => i.amount));
  const risks = computeRiskMatrix({ hasData, snapshot, inversionTotal });

  const projectedVentas = projectWithGrowth(snapshot.statement.ventas * 12, DEFAULT_ANNUAL_GROWTH_PCT, PROJECTION_YEARS);
  const projectedUtilidad = projectWithGrowth(snapshot.statement.utilidadNeta * 12, DEFAULT_ANNUAL_GROWTH_PCT, PROJECTION_YEARS);
  const projectionData: ProjectionPoint[] = projectedVentas.map((ventas, i) => ({
    year: `Año ${i + 1}`,
    ventas,
    utilidadNeta: projectedUtilidad[i],
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Business Plan con IA</h1>
        <p className="text-sm text-slate-500">
          Secciones cualitativas editables con ayuda de IA, y secciones financieras que se renderizan en vivo desde tus
          datos reales — nunca texto congelado (spec §18).
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {BUSINESS_PLAN_SECTION_ORDER.map((key) => (
          <SectionEditor
            key={key}
            sectionKey={key}
            label={BUSINESS_PLAN_SECTION_LABELS[key]}
            description={SECTION_DESCRIPTIONS[key]}
            initialContent={contentByKey.get(key) ?? ""}
          />
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Secciones financieras (en vivo)</h2>
        <p className="text-sm text-slate-500">
          Calculadas por el Financial Engine y el Risk Engine cada vez que abres esta página — no se guardan como texto
          fijo (spec §18).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">Inversión inicial</CardTitle>
          <CardDescription>Capital necesario registrado en Inversión Inicial.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-slate-700">
            Capital total requerido: <span className="font-semibold text-slate-900">{formatCurrency(inversionTotal, company.currency)}</span>
          </p>
          <InvestmentsTable investments={investments} currency={company.currency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">Proyección financiera a {PROJECTION_YEARS} años</CardTitle>
          <CardDescription>
            Ventas y utilidad neta anualizadas, proyectadas con un crecimiento anual supuesto del {DEFAULT_ANNUAL_GROWTH_PCT}%
            (spec §0.3).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectionChart data={projectionData} currency={company.currency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">Riesgos</CardTitle>
          <CardDescription>Matriz de riesgos calculada por reglas determinísticas, no por IA (spec §17.2).</CardDescription>
        </CardHeader>
        <CardContent>
          <RiskMatrixTable risks={risks} />
        </CardContent>
      </Card>
    </div>
  );
}
