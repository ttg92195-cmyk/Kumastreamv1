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
  title: {
    default: "CINE STREAM - Movies & Series",
    template: "%s | CINE STREAM",
  },
  description: "Watch your favorite movies and TV series in high quality. Myanmar subtitle included.",
  keywords: ["Movies", "Series", "Streaming", "4K", "Myanmar Subtitle", "Download", "Watch Movies", "TV Shows"],
  authors: [{ name: "CINE STREAM" }],
  creator: "CINE STREAM",
  publisher: "CINE STREAM",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://kumastreamv1.vercel.app",
    siteName: "CINE STREAM",
    title: "CINE STREAM - Movies & Series",
    description: "Watch your favorite movies and TV series in high quality. Myanmar subtitle included.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CINE STREAM",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CINE STREAM - Movies & Series",
    description: "Watch your favorite movies and TV series in high quality. Myanmar subtitle included.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://kumastreamv1.vercel.app",
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
