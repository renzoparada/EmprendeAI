import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const company = await prisma.company.findFirst({ where: { userId: session.user.id } });
  if (company) redirect("/dashboard");

  // Un administrador no necesita una empresa propia para usar el Panel Admin.
  if (session.user.role === "ADMIN") redirect("/admin");

  redirect("/onboarding");
}
