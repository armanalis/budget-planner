"use client";

import { useLayoutEffect } from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import type { ReactNode } from "react";

const STORAGE_KEY = "budget-planner-ui-theme";

/**
 * next-themes initializes `theme` with `undefined` on the server (it cannot read
 * localStorage). That undefined state hydrates to the client, so `resolvedTheme`
 * stays out of sync with the inline script that already applied `dark` on
 * `<html>`. Clicks then call `setTheme("dark")` while the UI is already dark.
 * Sync once on the client from storage / the real `classList`.
 */
function ThemeStateSync({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme();

  useLayoutEffect(() => {
    if (theme === "light" || theme === "dark") return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
        return;
      }
    } catch {
      /* ignore */
    }

    setTheme(
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
  }, [theme, setTheme]);

  return children;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      storageKey={STORAGE_KEY}
    >
      <ThemeStateSync>{children}</ThemeStateSync>
    </NextThemesProvider>
  );
}
