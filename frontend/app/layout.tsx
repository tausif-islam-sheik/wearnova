import type { Metadata } from "next";
import { Inter, Playfair_Display, Bebas_Neue } from "next/font/google";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteLayout } from "@/components/shared/SiteLayout";
import { ListingsHydrator } from "@/components/shared/ListingsHydrator";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

const bebas = Bebas_Neue({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "Wearnova | Buy & Sell Pre-Loved Fashion",
    template: "%s | Wearnova",
  },
  description:
    "Your peer-to-peer marketplace for pre-loved fashion, electronics, home goods, and more. Buy and sell safely.",
  openGraph: {
    type: "website",
    siteName: "Wearnova",
    title: "Wearnova | Buy & Sell Pre-Loved Fashion",
    description:
      "Your peer-to-peer marketplace for pre-loved fashion, electronics, home goods, and more. Buy and sell safely.",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${bebas.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TooltipProvider delay={300}>
          <SiteLayout>
            <ListingsHydrator />
            {children}
          </SiteLayout>
        </TooltipProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
