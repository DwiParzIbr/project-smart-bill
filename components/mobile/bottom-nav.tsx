"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PlusCircle,
  ScanLine,
  History,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  // Sembunyikan bottom navigation saat di halaman wizard create atau result page
  // agar tidak menutupi tombol sticky actions di bagian bawah
  if (pathname.startsWith("/create") || pathname.includes("/result")) {
    return null;
  }

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/create", label: "Buat Bill", icon: PlusCircle },
    { href: "/scan", label: "Scan", icon: ScanLine },
    { href: "/history", label: "Riwayat", icon: History },
    { href: "/profile", label: "Saya", icon: User },
  ];

  return (
    <nav
      aria-label="Navigasi Bawah Utama"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] sm:hidden"
    >
      <div className="grid grid-cols-5 items-center h-14 max-w-md mx-auto px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center h-full py-1 transition-colors min-touch-target",
                isActive
                  ? "text-sky-600 font-bold"
                  : "text-slate-500 hover:text-slate-800 font-medium"
              )}
            >
              <div className="relative flex items-center justify-center h-5">
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform duration-150",
                    isActive
                      ? "scale-110 text-sky-600 stroke-[2.3]"
                      : "stroke-[1.8] group-hover:scale-105"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] mt-1 leading-none tracking-tight transition-colors",
                  isActive ? "text-sky-600 font-bold" : "text-slate-500"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo.png"
            alt="Smart Bill Logo"
            className="w-9 h-9 rounded-xl shadow-xs transition-transform group-hover:scale-105 object-cover"
          />
          <div>
            <span className="font-bold text-slate-900 tracking-tight text-lg">
              Smart Bill
            </span>
          </div>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden sm:flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className={cn(
              "px-3.5 py-2 text-sm rounded-lg font-medium transition",
              pathname === "/"
                ? "bg-slate-100 text-sky-700 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            Dashboard
          </Link>
          <Link
            href="/create"
            className={cn(
              "px-3.5 py-2 text-sm rounded-lg font-medium transition flex items-center gap-1.5",
              pathname === "/create"
                ? "bg-slate-100 text-sky-700 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <PlusCircle className="w-4 h-4" />
            Buat Bill
          </Link>
          <Link
            href="/history"
            className={cn(
              "px-3.5 py-2 text-sm rounded-lg font-medium transition flex items-center gap-1.5",
              pathname === "/history"
                ? "bg-slate-100 text-sky-700 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <History className="w-4 h-4" />
            Riwayat
          </Link>
          <Link
            href="/profile"
            className={cn(
              "px-3.5 py-2 text-sm rounded-lg font-medium transition flex items-center gap-1.5",
              pathname === "/profile"
                ? "bg-slate-100 text-sky-700 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <User className="w-4 h-4" />
            Saya
          </Link>
          <Link
            href="/scan"
            className="ml-2 inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <ScanLine className="w-4 h-4" />
            Scan Struk
          </Link>
        </nav>
      </div>
    </header>
  );
}
