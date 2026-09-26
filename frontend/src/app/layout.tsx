import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/stocksense/Providers";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "StockSense — Inventory Management",
    template: "%s | StockSense",
  },
  description:
    "StockSense is a real-time, multi-warehouse inventory management system for tracking receipts, deliveries, transfers, and stock adjustments.",
  keywords: ["inventory", "stock management", "warehouse", "IMS"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: "10px",
                fontFamily: "Inter, sans-serif",
              },
            }}
            richColors
          />
        </Providers>
      </body>
    </html>
  );
}
