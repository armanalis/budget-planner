"use client";

import { useLayoutEffect } from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import type { ReactNode } from "react";

const STORAGE_KEY = "budget-planner-ui-theme";

/** Keep `next-themes` in sync with what is already on `<html>` after hydration. */
function ThemeStateSync({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme();

  useLayoutEffect(() => {
    // #region agent log
    fetch("http://127.0.0.1:7863/ingest/47e3ad6d-fc70-4a01-9dfc-fd6ebfda7cca", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "b2f15c",
      },
      body: JSON.stringify({
        sessionId: "b2f15c",
        runId: "post-fix",
        hypothesisId: "H4",
        location: "components/ThemeProvider.tsx:useLayoutEffect",
        message: "Theme sync effect",
        data: {
          theme,
          htmlHasDarkClass: document.documentElement.classList.contains("dark"),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    if (theme === "light" || theme === "dark") return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
        return;
      }
    } catch {
      /* ignore localStorage access errors */
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
