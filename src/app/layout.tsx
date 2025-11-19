import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShellWrapper from "@/components/layout/AppShellWrapper";
import AppShellSimple from "@/components/layout/AppShellSimple";
import AccountSwitchingOverlay from "@/components/AccountSwitchingOverlay";
import { AuthProvider } from "@/lib/authContext";
import { ChatProvider } from "@/lib/chatProvider";
import { ModalProvider } from "@/lib/modalContext";
import { QueryClientProvider } from '@tanstack/react-query';
import { QueryClientWrapper } from '@/components/QueryClientWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import StoreHydration from '@/components/StoreHydration';
import GlobalInputFix from '@/components/GlobalInputFix';

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

export const viewport = "width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no, interactive-widget=resizes-content, shrink-to-fit=no";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ErrorBoundary>
          <StoreHydration />
          <GlobalInputFix />
        <QueryClientWrapper>
          <AuthProvider>
            <ChatProvider>
              <ModalProvider>
                <AppShellWrapper>
                  {children}
                </AppShellWrapper>
                <AccountSwitchingOverlay />
              </ModalProvider>
            </ChatProvider>
          </AuthProvider>
        </QueryClientWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}
