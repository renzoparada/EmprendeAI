"use client";

import { useActionState, useState } from "react";
import { completeOnboarding } from "@/lib/actions/onboarding-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  BUSINESS_TYPE_LABELS,
  CURRENCY_OPTIONS,
  OPERATING_STAGE_LABELS,
  USER_TYPE_LABELS,
} from "@/lib/constants";

const initialState: ActionState = {};

const STEPS = ["Tipo de usuario", "Tipo de negocio", "Información básica", "Estado operativo"];

function RadioCard({
  name,
  value,
  label,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center rounded-lg border px-4 py-3 text-sm transition-colors",
        checked ? "border-emerald-600 bg-emerald-50 font-medium text-emerald-800" : "border-slate-200 hover:bg-slate-50"
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="sr-only"
        required
      />
      {label}
    </label>
  );
}

export function OnboardingWizard() {
  const [state, formAction, isPending] = useActionState(completeOnboarding, initialState);
  const [step, setStep] = useState(0);
  const [userType, setUserType] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [operatingStage, setOperatingStage] = useState("");

  const canAdvance = () => {
    if (step === 0) return !!userType;
    if (step === 1) return !!businessType;
    return true;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-6 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  i <= step ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                )}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={cn("h-0.5 flex-1", i < step ? "bg-emerald-600" : "bg-slate-200")} />}
            </div>
          ))}
        </div>
        <p className="mb-4 text-sm font-medium text-slate-500">{STEPS[step]}</p>

        <form action={formAction} className="flex flex-col gap-5">
          {/* Paso 1 — Tipo de usuario */}
          <div className={cn("grid grid-cols-2 gap-2", step !== 0 && "hidden")}>
            {Object.entries(USER_TYPE_LABELS).map(([value, label]) => (
              <RadioCard key={value} name="userType" value={value} label={label} checked={userType === value} onChange={setUserType} />
            ))}
          </div>

          {/* Paso 2 — Tipo de negocio */}
          <div className={cn("grid grid-cols-2 gap-2", step !== 1 && "hidden")}>
            {Object.entries(BUSINESS_TYPE_LABELS).map(([value, label]) => (
              <RadioCard
                key={value}
                name="businessType"
                value={value}
                label={label}
                checked={businessType === value}
                onChange={setBusinessType}
              />
            ))}
          </div>

          {/* Paso 3 — Información básica */}
          <div className={cn("grid grid-cols-2 gap-4", step !== 2 && "hidden")}>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="name">Nombre del negocio</Label>
              <Input id="name" name="name" required={step === 2} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="country">País</Label>
              <Input id="country" name="country" required={step === 2} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" name="city" required={step === 2} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currency">Moneda funcional</Label>
              <select
                id="currency"
                name="currency"
                required={step === 2}
                defaultValue="BOB"
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sector">Sector (opcional)</Label>
              <Input id="sector" name="sector" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startDate">Fecha de inicio</Label>
              <Input id="startDate" name="startDate" type="date" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="employeeCount">N° de empleados</Label>
              <Input id="employeeCount" name="employeeCount" type="number" min={0} />
            </div>
          </div>

          {/* Paso 4 — Estado operativo */}
          <div className={cn("flex flex-col gap-2", step !== 3 && "hidden")}>
            <p className="text-sm text-slate-600">¿Tu negocio ya está funcionando?</p>
            {Object.entries(OPERATING_STAGE_LABELS).map(([value, label]) => (
              <RadioCard
                key={value}
                name="operatingStage"
                value={value}
                label={label}
                checked={operatingStage === value}
                onChange={setOperatingStage}
              />
            ))}
          </div>

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}

          <div className="flex justify-between pt-2">
            <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
              Atrás
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" disabled={!canAdvance()} onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
                Siguiente
              </Button>
            ) : (
              <Button type="submit" disabled={isPending || !operatingStage}>
                {isPending ? "Creando negocio..." : "Finalizar"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
