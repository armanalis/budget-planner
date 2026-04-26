import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/app-shell";
import { ExpenseProvider } from "@/context/ExpenseContext";

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50">
        <ExpenseProvider>
          <AppShell>{children}</AppShell>
        </ExpenseProvider>
      </body>
    </html>
  );
}
