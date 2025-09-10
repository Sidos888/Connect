"use client";

import AppShell from "./AppShell";

interface AppShellWrapperProps {
  children: React.ReactNode;
}

export default function AppShellWrapper({ children }: AppShellWrapperProps) {
  return (
    <AppShell>
      {children}
    </AppShell>
  );
}
