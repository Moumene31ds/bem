// /home/moumene/bem/frontend/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EpicGrad 2026 - Algerian Virtual Graduation Party",
  description: "Join the massive real-time 3D beach celebration for Algerian BEM and BAC 2026 graduates!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-white overflow-hidden h-screen w-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
