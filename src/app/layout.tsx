import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShellWrapper from "@/components/layout/AppShellWrapper";
import AccountSwitchingOverlay from "@/components/AccountSwitchingOverlay";
import { AuthProvider } from "@/lib/authContext";
import { ModalProvider } from "@/lib/modalContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Connect",
  description: "Connect MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no, interactive-widget=resizes-content, shrink-to-fit=no" />
        <meta name="cache-control" content="no-cache, no-store, must-revalidate" />
        <meta name="pragma" content="no-cache" />
        <meta name="expires" content="0" />
        <meta name="version" content="CACHE-BUST-2025-01-29-001" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ModalProvider>
            <AppShellWrapper>
              {children}
            </AppShellWrapper>
            <AccountSwitchingOverlay />
          </ModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
