"use client";

import { SessionProvider } from "next-auth/react";
import { ColorPickerPanel } from "@/components/theme/ColorPickerPanel";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <ColorPickerPanel />
      </ThemeProvider>
    </SessionProvider>
  );
}
