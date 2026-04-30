import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/movie/Sidebar";
import { BottomNav } from "@/components/movie/BottomNav";
import ScrollHandler from "@/components/ScrollHandler";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a2e" },
  ],
};

export const metadata: Metadata = {
  title: "CINE STREAM - Movies & Series",
  description: "Watch your favorite movies and TV series in high quality. Myanmar subtitle included.",
  keywords: ["Movies", "Series", "Streaming", "4K", "Myanmar Subtitle", "Download"],
  authors: [{ name: "CINE STREAM" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "CINE STREAM",
    description: "Watch your favorite movies and TV series in high quality",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-[#0f0f0f] text-white`}>
        <ScrollHandler />
        <Sidebar />
        <main className="min-h-screen">
          {children}
        </main>
        <BottomNav />
        <Toaster />
      </body>
    </html>
  );
}
