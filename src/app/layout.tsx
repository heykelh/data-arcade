import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";
import { C } from "@/lib/palette";
import { I18nProvider } from "@/lib/i18n";
import { SoundProvider } from "@/lib/sound";
import CRT from "@/components/CRT";
import Chrome from "@/components/Chrome";

const pressStart = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-press-start", display: "swap" });

export const metadata: Metadata = {
  title: "Data Arcade",
  description: "Une borne d'arcade rétro autour de la data & de la gouvernance. A retro arcade about data & AI governance.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={pressStart.variable}>
      <body style={{ margin: 0, background: C.bg, minHeight: "100vh" }}>
        <I18nProvider>
          <SoundProvider>
            <CRT />
            <Chrome />
            {children}
          </SoundProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
