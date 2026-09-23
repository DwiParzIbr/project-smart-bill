import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PWAProvider } from "@/components/pwa/pwa-provider";
import { AppHeader, BottomNav } from "@/components/mobile/bottom-nav";

export const metadata: Metadata = {
  title: "Smart Bill & Receipt Splitter",
  description: "Bagi tagihan makan bersama secara adil, cepat, dan transparan dari struk maupun input manual.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Smart Bill",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0284c7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-sky-500 selection:text-white">
        <PWAProvider>
          <AppHeader />
          <div className="flex-1">{children}</div>
          <BottomNav />
        </PWAProvider>
      </body>
    </html>
  );
}
