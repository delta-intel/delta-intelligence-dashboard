import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  title: "Delta Intelligence",
  description: "Real-time geopolitical and market risk dashboard. Open source intelligence signals derived from public data.",
  keywords: ["OSINT", "Delta Intelligence", "geopolitical risk", "market signals", "risk dashboard", "real-time intelligence"],
  authors: [{ name: "Delta Intelligence" }],
  openGraph: {
    title: "Delta Intelligence",
    description: "Real-time OSINT risk signals dashboard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Delta Intelligence",
    description: "Delta Intelligence - Real-time OSINT risk signals",
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${jetbrainsMono.variable} antialiased scanlines`}>
        {children}
      </body>
    </html>
  );
}
