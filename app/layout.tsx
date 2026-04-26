import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/app-shell";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ExpenseProvider } from "@/context/ExpenseContext";
import { LanguageProvider } from "@/context/LanguageContext";

export const metadata: Metadata = {
  title: "Budget Planner",
  description: "Mobile-first PWA budget tracker shell",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-full min-h-full antialiased bg-slate-50 text-slate-900 dark:bg-gray-950 dark:text-slate-100">
        <ThemeProvider>
          <LanguageProvider>
            <ExpenseProvider>
              <AppShell>{children}</AppShell>
            </ExpenseProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
