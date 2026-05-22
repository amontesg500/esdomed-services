"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, ArrowRightLeft, HeartPulse, Printer, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";

const navItems = [
  { href: "/dashboard",             label: "Inicio",      icon: LayoutDashboard, exact: true },
  { href: "/dashboard/traslados",   label: "Traslados",   icon: ArrowRightLeft },
  { href: "/dashboard/fallecidos",  label: "Fallecidos",  icon: HeartPulse },
  { href: "/dashboard/impresiones", label: "Impresiones", icon: Printer },
  { href: "/dashboard/usuarios",    label: "Usuarios",    icon: Users },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!profile || profile.role === "medico") {
        router.replace("/login");
      } else if (profile.role === "psicologia" && pathname !== "/dashboard/fallecidos") {
        router.replace("/dashboard/fallecidos");
      }
    }
  }, [loading, profile, router, pathname]);

  const filteredNavItems = navItems.filter(item => {
    if (profile?.role === "psicologia") {
      return item.href === "/dashboard/fallecidos";
    }
    return true;
  });

  const roleLabel = profile?.role === "psicologia" ? "Psicología" 
                  : profile?.role === "trabajo_social" ? "Trabajo Social" 
                  : profile?.role === "admin" ? "Administración" 
                  : "ESDOMED";

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar navItems={filteredNavItems} roleLabel={roleLabel} />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0 bg-slate-50 dark:bg-slate-950">
        {loading || !profile ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : children}
      </main>
    </div>
  );
}
