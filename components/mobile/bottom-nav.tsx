"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ReceiptText, Plus, History, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  // Hide bottom navigation on wizard and result pages to avoid blocking the sticky action buttons
  if (pathname.startsWith("/create") || pathname.includes("/result")) {
    return null;
  }

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/scan", label: "Scan", icon: ScanLine },
    { href: "/create", label: "Buat Bill", icon: Plus, isPrimary: true },
    { href: "/history", label: "Riwayat", icon: History },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 pb-safe sm:hidden">
      <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-3 flex flex-col items-center group"
                aria-label={item.label}
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-500 shadow-lg shadow-sky-500/30 flex items-center justify-center text-white transition-transform active:scale-95 group-hover:scale-105">
                  <Icon className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-medium text-slate-600 mt-0.5">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-14 h-full gap-1 transition-colors min-touch-target",
                isActive
                  ? "text-sky-600 font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
              <span className="text-[11px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
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
            <span className="hidden sm:inline-block ml-2 text-xs font-medium px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full border border-sky-200">
              PWA Splitter
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
            href="/scan"
            className={cn(
              "px-3.5 py-2 text-sm rounded-lg font-medium transition flex items-center gap-1.5",
              pathname === "/scan"
                ? "bg-slate-100 text-sky-700 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <ScanLine className="w-4 h-4" />
            Scan Struk
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
            href="/create"
            className="ml-2 inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Buat Bill
          </Link>
        </nav>
      </div>
    </header>
  );
}
