import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { CartProvider } from "@/lib/CartContext";
import Header from "@/components/Header";
import { ChatWidget } from "@/components/ChatWidget";
import { SessionProvider } from "next-auth/react";

// All pages require auth/session — skip static prerendering
export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gemstone Earrings - Premium Sterling Silver Jewelry",
  description: "Discover 254 unique gemstone earring designs with premium sterling silver settings",
  verification: {
    google: "j01C-ArQYEUoAFF4UMQpAyzs85kDdsDUqBgYGv0oi6U",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#9333ea" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9FFETKZG8L"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-9FFETKZG8L');
          `}
        </Script>

        <SessionProvider>
          <CartProvider>
            <Header />
            {children}
            <ChatWidget />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
