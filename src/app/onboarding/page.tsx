import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const existing = await prisma.company.findFirst({ where: { userId: session.user.id } });
  if (existing) redirect("/dashboard");

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Cuéntanos sobre tu negocio</h1>
        <p className="mt-1 text-sm text-slate-500">
          Con esto construimos tu modelo financiero inicial. Podrás editarlo todo después.
        </p>
      </div>
      <OnboardingWizard />
    </div>
  );
}
