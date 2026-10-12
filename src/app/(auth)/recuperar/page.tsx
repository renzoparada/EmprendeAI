"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/password-reset-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const initialState: ActionState = {};

export default function RecuperarPage() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-slate-900 text-lg">Recupera tu contraseña</CardTitle>
        <CardDescription>Te enviamos un link para elegir una nueva.</CardDescription>
      </CardHeader>
      <CardContent>
        {state.success ? (
          <p className="text-sm text-slate-600">
            Si existe una cuenta con ese email, te enviamos un link para restablecer tu contraseña. Revisa tu bandeja de
            entrada (y spam).
          </p>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" placeholder="tu@empresa.com" />
            </div>
            {state.error && <p className="text-sm text-red-600">{state.error}</p>}
            <Button type="submit" disabled={isPending} className="mt-2">
              {isPending ? "Enviando..." : "Enviar link de recuperación"}
            </Button>
          </form>
        )}
        <p className="mt-4 text-center text-sm text-slate-500">
          <Link href="/login" className="font-medium text-emerald-700 hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
