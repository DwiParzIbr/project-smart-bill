"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { WifiOff, Download, X, Smartphone, ArrowRight } from "lucide-react";
import { PWAInstallModal } from "./pwa-install-modal";

interface PWAContextType {
  isOnline: boolean;
  canInstall: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  showInstallModal: boolean;
  openInstallGuide: () => void;
  closeInstallGuide: () => void;
  installApp: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType>({
  isOnline: true,
  canInstall: false,
  isStandalone: false,
  isIOS: false,
  isAndroid: false,
  showInstallModal: false,
  openInstallGuide: () => {},
  closeInstallGuide: () => {},
  installApp: async () => {},
});

export const usePWA = () => useContext(PWAContext);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Detect Standalone Display Mode (Installed PWA)
    const standaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    setIsStandalone(standaloneMode);

    // 2. Detect Device OS
    const userAgent = navigator.userAgent || "";
    const iosDevice =
      /iPad|iPhone|iPod/.test(userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const androidDevice = /Android/.test(userAgent);

    setIsIOS(iosDevice);
    setIsAndroid(androidDevice);

    // 3. Register Service Worker for PWA compliance & offline capability
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .catch((err) => console.log("SW registration note:", err));
      });
    }

    // 4. Online / Offline status
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 5. Handle BeforeInstallPrompt (Chrome, Edge, Samsung Internet)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 6. Show Smart Banner if not in standalone mode and not dismissed in session
    if (!standaloneMode) {
      const isDismissed = sessionStorage.getItem("pwa_banner_dismissed") === "true";
      if (!isDismissed) {
        const timer = setTimeout(() => {
          setShowInstallBanner(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setCanInstall(false);
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback: open manual install guide
      setShowInstallModal(true);
    }
  };

  const openInstallGuide = () => {
    setShowInstallModal(true);
  };

  const closeInstallGuide = () => {
    setShowInstallModal(false);
  };

  const dismissBanner = () => {
    setShowInstallBanner(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pwa_banner_dismissed", "true");
    }
  };

  return (
    <PWAContext.Provider
      value={{
        isOnline,
        canInstall,
        isStandalone,
        isIOS,
        isAndroid,
        showInstallModal,
        openInstallGuide,
        closeInstallGuide,
        installApp,
      }}
    >
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

      {/* Smart PWA Install Banner: Hanya muncul saat diakses via Web Browser (bukan Standalone) */}
      {!isStandalone && showInstallBanner && (
        <aside
          aria-label="Pemasangan aplikasi"
          className="fixed top-3 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 z-50 bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div
            className="flex items-center gap-3 cursor-pointer min-w-0"
            onClick={openInstallGuide}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-slate-100 truncate">Pasang Smart Bill</p>
                <span className="text-[9px] font-bold bg-sky-500/20 text-sky-400 px-1 py-0.2 rounded border border-sky-500/30">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                {isIOS
                  ? "Pasang di iPhone tanpa buka Safari"
                  : canInstall
                  ? "Pasang 1-klik ke Layar Utama"
                  : "Bebas dari browser web di HP"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {canInstall ? (
              <button
                onClick={installApp}
                className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
            ) : (
              <button
                onClick={openInstallGuide}
                className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1"
              >
                <span>Pasang</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={dismissBanner}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
              aria-label="Tutup Banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Comprehensive Install Guide Modal */}
      <PWAInstallModal
        isOpen={showInstallModal}
        onClose={closeInstallGuide}
        canInstall={canInstall}
        onInstall={installApp}
        isIOS={isIOS}
        isAndroid={isAndroid}
      />

      {children}
    </PWAContext.Provider>
  );
}
