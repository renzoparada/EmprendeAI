import { requireCompany } from "@/lib/actions/guard";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CompanyProfileForm } from "@/components/perfil/company-profile-form";
import { PlanSelector } from "@/components/perfil/plan-selector";
import { USER_TYPE_LABELS, BUSINESS_TYPE_LABELS, OPERATING_STAGE_LABELS } from "@/lib/constants";

export default async function PerfilPage() {
  const { session, company } = await requireCompany();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Perfil</h1>
        <p className="text-sm text-slate-500">Tu cuenta, tu negocio y tu plan (spec §25).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">Cuenta</CardTitle>
          <CardDescription>
            {user.name} · {user.email}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">Tu negocio</CardTitle>
          <CardDescription>
            {USER_TYPE_LABELS[company.userType]} · {BUSINESS_TYPE_LABELS[company.businessType]} ·{" "}
            {OPERATING_STAGE_LABELS[company.operatingStage]}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyProfileForm company={company} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">Plan</CardTitle>
          <CardDescription>PRO, BUSINESS y CONSULTOR llegan en las siguientes fases del roadmap (spec §30).</CardDescription>
        </CardHeader>
        <CardContent>
          <PlanSelector currentPlan={user.planCode} />
        </CardContent>
      </Card>
    </div>
  );
}
