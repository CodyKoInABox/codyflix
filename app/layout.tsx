import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import { Providers } from "@/components/app-state";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { HoverCard } from "@/components/hover-card";
import { ProfileGate } from "@/components/profile-gate";
import { TitleDialog } from "@/components/title-dialog";
import { getCatalog } from "@/lib/catalog";
import { STORAGE_KEY } from "@/lib/store";
import "./globals.css";

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const gateBoot = `(function(){try{var raw=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});var data=raw?JSON.parse(raw):null;var id=data&&data.activeProfileId;var profiles=data&&data.profiles;var ok=!!(id&&Array.isArray(profiles)&&profiles.some(function(p){return p&&p.id===id&&p.name;}));document.documentElement.dataset.gate=ok?"app":"open";}catch(e){document.documentElement.dataset.gate="open";}})();`;

export const metadata: Metadata = {
  title: {
    default: "Codyflix",
    template: "%s · Codyflix",
  },
  description:
    "Codyflix is a fan-made Netflix-style browser for Cody Ko and the YouTube channels around him. Videos play from YouTube.",
  applicationName: "Codyflix",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#141414",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable}`}>
      <body>
        <Script id="codyflix-gate" strategy="beforeInteractive">
          {gateBoot}
        </Script>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Providers catalog={getCatalog()}>
          <ProfileGate />
          <div className="app-shell">
            <Suspense fallback={<div className="site-header is-inner" />}>
              <Header />
            </Suspense>
            <main id="main" tabIndex={-1}>
              {children}
            </main>
            <Footer />
          </div>
          <TitleDialog />
          <HoverCard />
        </Providers>
      </body>
    </html>
  );
}
