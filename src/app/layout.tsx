import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { Toaster } from "@/components/ui/toaster";

import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Keyni — Espace client",
    template: "%s — Keyni",
  },
  description:
    "Votre espace client Keyni : suivez vos contrats, votre score Keyni, vos documents et vos sinistres en un seul endroit.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#14b8a6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={sans.variable}>
      <body className="min-h-dvh bg-background font-sans text-text-primary">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
