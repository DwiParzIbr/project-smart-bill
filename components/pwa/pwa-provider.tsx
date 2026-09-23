"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { WifiOff, Download, X } from "lucide-react";

interface PWAContextType {
  isOnline: boolean;
  canInstall: boolean;
  installApp: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType>({
  isOnline: true,
  canInstall: false,
  installApp: async () => {},
});

export const usePWA = () => useContext(PWAContext);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // 1. Service Worker registration (production only to prevent dev HMR / asset caching loops on mobile)
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        window.addEventListener("load", () => {
          navigator.serviceWorker
            .register("/sw.js")
            .catch((err) => console.log("SW registration failed:", err));
        });
      } else {
        // In dev, ensure any old registered SW is removed so mobile doesn't stall
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
      }
    }

    // 2. Online / Offline status
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // 3. BeforeInstallPrompt
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setCanInstall(true);
        // Show banner after 3 seconds if not in standalone mode
        const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
        if (!isStandalone) {
          setTimeout(() => setShowInstallBanner(true), 2500);
        }
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstall);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      };
    }
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setCanInstall(false);
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <PWAContext.Provider value={{ isOnline, canInstall, installApp }}>
      {/* Offline banner */}
      {!isOnline && (
        <aside
          aria-label="Status koneksi offline"
          className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white text-xs sm:text-sm px-4 py-2 flex items-center justify-center gap-2 shadow-md animate-pulse"
        >
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Anda sedang offline. Data dan draft tetap tersimpan di perangkat Anda.</span>
        </aside>
      )}

      {/* PWA Install Banner */}
      {showInstallBanner && canInstall && (
        <aside
          aria-label="Pemasangan aplikasi"
          className="fixed top-3 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 z-50 bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-100">Pasang Smart Bill</p>
              <p className="text-[11px] text-slate-300">Akses cepat & offline langsung dari Home Screen</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={installApp}
              className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-lg transition"
            >
              Install
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="p-1 text-slate-400 hover:text-slate-200"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {children}
    </PWAContext.Provider>
  );
}
