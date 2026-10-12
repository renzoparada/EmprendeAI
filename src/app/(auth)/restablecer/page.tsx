import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function RestablecerPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-slate-900 text-lg">Restablece tu contraseña</CardTitle>
        <CardDescription>Elige una nueva contraseña para tu cuenta.</CardDescription>
      </CardHeader>
      <CardContent>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <p className="text-sm text-red-600">
            Este link no es válido. Pedí uno nuevo desde{" "}
            <Link href="/recuperar" className="font-medium text-emerald-700 hover:underline">
              recuperar contraseña
            </Link>
            .
          </p>
        )}
      </CardContent>
    </Card>
  );
}
