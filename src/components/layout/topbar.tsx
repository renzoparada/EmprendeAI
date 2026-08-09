import { LogOut } from "lucide-react";
import { logoutUser } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";

export function Topbar({ companyName, userName }: { companyName: string; userName: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <div>
        <p className="text-sm font-semibold text-slate-900">{companyName}</p>
        <p className="text-xs text-slate-500">Hola, {userName}</p>
      </div>
      <form action={logoutUser}>
        <Button type="submit" variant="ghost" size="sm">
          <LogOut className="h-4 w-4" />
          Salir
        </Button>
      </form>
    </header>
  );
}
