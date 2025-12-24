import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Poker Nights | Gestión de Partidas",
  description: "Lleva el registro de tus partidas de poker con amigos. Calcula ganancias y pérdidas fácilmente.",
  keywords: ["poker", "partidas", "ganancias", "pérdidas", "amigos", "fichas"],
  authors: [{ name: "Poker Nights" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Poker Nights",
  },
  openGraph: {
    title: "Poker Nights",
    description: "Lleva el registro de tus partidas de poker con amigos. Calcula ganancias y pérdidas fácilmente.",
    siteName: "Poker Nights",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Poker Nights",
    description: "Lleva el registro de tus partidas de poker con amigos.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f1419",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${outfit.variable} antialiased`}>
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
