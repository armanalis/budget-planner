"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartColumnBig,
  CirclePlus,
  HandCoins,
  LogOut,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useExpenses } from "@/context/ExpenseContext";

type NavItem = {
  href: string;
  label: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    title: "Dashboard",
    icon: ChartColumnBig,
  },
  {
    href: "/add",
    label: "Add Entry",
    title: "Add Entry",
    icon: CirclePlus,
  },
  {
    href: "/ali",
    label: "Ali",
    title: "Ali",
    icon: UserRound,
  },
  {
    href: "/zeynep",
    label: "Zeynep",
    title: "Zeynep",
    icon: UsersRound,
  },
  {
    href: "/joint-account",
    label: "Joint",
    title: "Joint Account",
    icon: HandCoins,
  },
];

function getActiveTitle(pathname: string): string {
  const activeItem = navItems.find((item) => item.href === pathname);
  return activeItem?.title ?? "Budget Tracker";
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeTitle = getActiveTitle(pathname);
  const { currentUser, selectedMonth, setCurrentUser, setSelectedMonth } =
    useExpenses();

  if (!currentUser) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Budget Planner</h1>
          <p className="mt-2 text-sm text-slate-600">Choose a user to continue.</p>
        </div>

        <button
          type="button"
          onClick={() => setCurrentUser("Ali")}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white"
        >
          Log in as Ali
        </button>
        <button
          type="button"
          onClick={() => setCurrentUser("Zeynep")}
          className="w-full rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white"
        >
          Log in as Zeynep
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-base font-semibold">{activeTitle}</h1>
          <button
            type="button"
            onClick={() => setCurrentUser(null)}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-600">
            Active month
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-blue-500 focus:ring-2"
          />
        </div>
      </header>

      <main className="flex-1 px-4 py-5 pb-24">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md border-t border-slate-200 bg-white">
        <ul className="grid grid-cols-5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1 py-2 text-xs ${
                    isActive ? "text-blue-600" : "text-slate-500"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[11px]">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
