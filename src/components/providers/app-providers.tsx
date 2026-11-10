"use client";

import { Toaster } from "sonner";

import { AuthProvider } from "@/context/auth-context";
import { NotificationProvider } from "@/context/notification-context";
import { ThemeProvider, useTheme } from "@/context/theme-context";
import Navbar from "@/components/layout/navbar";
import BottomNav from "@/components/layout/bottom-nav";

function ThemedToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      theme={theme}
      position="top-center"
      richColors
      closeButton
      toastOptions={{ style: { borderRadius: "0.75rem" } }}
    />
  );
}

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Navbar />
          <div className="pb-20 lg:pb-0">{children}</div>
          <BottomNav />
          <ThemedToaster />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}