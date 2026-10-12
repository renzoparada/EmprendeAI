"use client";

import { useRouter } from "next/navigation";
import type { BusinessSimulation } from "@prisma/client";
import { Label } from "@/components/ui/label";

export function SimulationSelector({ simulations, selectedId }: { simulations: BusinessSimulation[]; selectedId?: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="simulation-switcher">Simulación</Label>
      <select
        id="simulation-switcher"
        value={selectedId}
        onChange={(e) => router.push(`/simulador?id=${e.target.value}`)}
        className="h-10 w-64 rounded-md border border-slate-300 bg-white px-3 text-sm"
      >
        {simulations.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
