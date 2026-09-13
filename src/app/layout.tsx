import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";
import { C } from "@/lib/palette";
import { I18nProvider } from "@/lib/i18n";
import { SoundProvider } from "@/lib/sound";
import CRT from "@/components/CRT";
import Chrome from "@/components/Chrome";

const pressStart = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-press-start", display: "swap" });
const vt323 = VT323({ weight: "400", subsets: ["latin"], variable: "--font-vt323", display: "swap" });

export const metadata: Metadata = {
  title: "Data Arcade",
  description: "Une borne d'arcade rétro autour de la data & de la gouvernance. A retro arcade about data & AI governance.",
  icons: { icon: "/gameboy.svg" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#12131f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pressStart.variable} ${vt323.variable}`}>
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
