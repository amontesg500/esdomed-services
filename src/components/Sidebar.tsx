"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, Sun, Moon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface SidebarProps {
  navItems: NavItem[];
  roleLabel: string;
}

export function Sidebar({ navItems, roleLabel }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const { profile, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : (pathname === item.href || pathname.startsWith(item.href + "/"));

  const SidebarBody = () => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Logo — centrado */}
      <div className="px-4 pt-5 pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col items-center gap-3">
        <Image
          src="/logo_hnes.png"
          alt="Hospital Nacional El Salvador"
          width={110}
          height={55}
          className="object-contain dark:brightness-0 dark:invert dark:opacity-90"
          priority
        />
        <div className="flex items-center gap-2.5 w-full">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white text-[10px] font-bold tracking-wide">ES</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight font-heading">{roleLabel}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-500 truncate">{profile?.nombre}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive({ href, label, icon: Icon, exact });
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-900/30"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} className="flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-4 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
        {profile?.servicio && (
          <p className="px-3 pb-1 text-[11px] text-slate-500 truncate">{profile.servicio}</p>
        )}
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
          {dark ? "Modo claro" : "Modo oscuro"}
        </button>
        <button
          onClick={() => { logout(); router.replace("/login"); }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-slate-500 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-all"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 flex items-center h-14 px-3 gap-3">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex-shrink-0 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
        <div className="flex-1 flex justify-center">
          <Image
            src="/logo_hnes.png"
            alt="Hospital"
            width={72}
            height={36}
            className="object-contain dark:brightness-0 dark:invert dark:opacity-80"
          />
        </div>
        <button
          onClick={toggle}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex-shrink-0 transition-colors"
          aria-label="Cambiar tema"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3.5 right-3 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors z-10"
          aria-label="Cerrar menú"
        >
          <X size={16} />
        </button>
        <SidebarBody />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-60 flex-shrink-0">
        <div className="h-screen sticky top-0">
          <SidebarBody />
        </div>
      </aside>
    </>
  );
}
