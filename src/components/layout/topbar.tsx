import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";
import { logoutUser } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { CompanySwitcher, type CompanySwitcherItem } from "@/components/layout/company-switcher";

export function Topbar({
  companies,
  activeCompanyId,
  userName,
  isAdmin,
}: {
  companies: CompanySwitcherItem[];
  activeCompanyId: string;
  userName: string;
  isAdmin: boolean;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <div>
        <CompanySwitcher companies={companies} activeCompanyId={activeCompanyId} />
        <p className="px-1.5 text-xs text-slate-500">Hola, {userName}</p>
      </div>
      <div className="flex items-center gap-2">
        {isAdmin && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin">
              <ShieldCheck className="h-4 w-4" />
              Panel Admin
            </Link>
          </Button>
        )}
        <form action={logoutUser}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut className="h-4 w-4" />
            Salir
          </Button>
        </form>
      </div>
    </header>
  );
}
