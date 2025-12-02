import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SwissCarMarket - Auto verkaufen in 30 Minuten",
  description: "Verkaufen Sie Ihr Auto schnell und einfach in der Schweiz. Faire Bewertung, sofortige Zahlung, kostenlose Abholung.",
  keywords: ["Auto verkaufen", "Schweiz", "Autoankauf", "SwissCarMarket"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
