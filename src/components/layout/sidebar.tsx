"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Wallet,
  Landmark,
  GitBranch,
  User,
  Tag,
  TrendingUp,
  Activity,
  Gem,
  Users,
  FileText,
  Target,
  Building2,
  Filter,
  LineChart,
  BookOpen,
  HandCoins,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
}

// Navegación completa de la spec §23.1 — los módulos fuera del alcance MVP
// (§30) quedan visibles pero deshabilitados con badge "Próximamente".
const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, enabled: true },
  { href: "/kpis", label: "Biblioteca de KPIs", icon: Gauge, enabled: true },
  { href: "/mi-negocio", label: "Mi Negocio", icon: Briefcase, enabled: true },
  { href: "/costos", label: "Estructura de Costos", icon: Wallet, enabled: true },
  { href: "/inversion", label: "Inversión Inicial", icon: Landmark, enabled: true },
  { href: "/financiamiento", label: "Financiamiento", icon: HandCoins, enabled: true },
  { href: "/escenarios", label: "Escenarios", icon: GitBranch, enabled: true },
  { href: "/precios", label: "Precios", icon: Tag, enabled: true },
  { href: "/ventas", label: "Ventas / Embudo", icon: Filter, enabled: true },
  { href: "/sensibilidad", label: "Sensibilidad", icon: Activity, enabled: true },
  { href: "/multimoneda", label: "Multimoneda", icon: TrendingUp, enabled: true },
  { href: "/valoracion", label: "Valoración", icon: Gem, enabled: true },
  { href: "/socios", label: "Socios / Cap Table", icon: Users, enabled: true },
  { href: "/inversionistas", label: "Dashboard Inversores", icon: LineChart, enabled: true },
  { href: "/plan-de-negocio", label: "Business Plan", icon: BookOpen, enabled: true },
  { href: "/reportes", label: "Reportes", icon: FileText, enabled: true },
  { href: "/metas", label: "Mis Metas", icon: Target, enabled: true },
  { href: "/negocios", label: "Mis Negocios", icon: Building2, enabled: true },
  { href: "/perfil", label: "Perfil", icon: User, enabled: true },
];
// El chat EMPRENDE AI (spec §10) no es una ruta del sidebar — vive como panel
// lateral flotante disponible en toda la app (ver EmprendeAIChatPanel).

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
        <span className="text-lg font-bold text-emerald-700">EMPRENDE AI</span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;

          if (!item.enabled) {
            return (
              <div
                key={item.href}
                className="flex cursor-not-allowed items-center justify-between rounded-md px-3 py-2 text-sm text-slate-400"
                title="Disponible en una próxima fase"
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  Pronto
                </Badge>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
