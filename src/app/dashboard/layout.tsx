"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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

  useEffect(() => {
    if (!loading && profile?.role !== "esdomed") router.replace("/login");
  }, [loading, profile, router]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar navItems={navItems} roleLabel="ESDOMED" />
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
