"use client";

import { useRef } from "react";
import type { PlanCode } from "@prisma/client";
import { adminUpdateUserPlan } from "@/lib/actions/admin-actions";
import { PLANS } from "@/lib/plans";

export function AdminPlanSelect({ userId, currentPlan }: { userId: string; currentPlan: PlanCode }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={adminUpdateUserPlan}>
      <input type="hidden" name="userId" value={userId} />
      <select
        name="planCode"
        defaultValue={currentPlan}
        onChange={() => formRef.current?.requestSubmit()}
        className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs"
      >
        {Object.values(PLANS).map((p) => (
          <option key={p.code} value={p.code}>
            {p.name}
          </option>
        ))}
      </select>
    </form>
  );
}
