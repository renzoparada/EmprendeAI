"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Building2, ChevronDown, Plus } from "lucide-react";
import { setActiveCompany } from "@/lib/actions/company-actions";
import { cn } from "@/lib/utils";

export interface CompanySwitcherItem {
  id: string;
  name: string;
}

export function CompanySwitcher({ companies, activeCompanyId }: { companies: CompanySwitcherItem[]; activeCompanyId: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = companies.find((c) => c.id === activeCompanyId);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-left hover:bg-slate-50">
        <div>
          <p className="text-sm font-semibold text-slate-900">{active?.name ?? "Selecciona empresa"}</p>
        </div>
        {companies.length > 1 && <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {companies.map((c) => (
            <form key={c.id} action={setActiveCompany}>
              <input type="hidden" name="companyId" value={c.id} />
              <button
                type="submit"
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50",
                  c.id === activeCompanyId ? "font-medium text-emerald-700" : "text-slate-700"
                )}
              >
                <Building2 className="h-4 w-4 text-slate-400" />
                {c.name}
              </button>
            </form>
          ))}
          <div className="my-1 border-t border-slate-100" />
          <Link href="/negocios/nueva" className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50" onClick={() => setOpen(false)}>
            <Plus className="h-4 w-4" />
            Nueva empresa
          </Link>
          <Link href="/negocios" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50" onClick={() => setOpen(false)}>
            Ver todas mis empresas
          </Link>
        </div>
      )}
    </div>
  );
}
