"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ChartColumnBig,
  CirclePlus,
  HandCoins,
  LogOut,
  Moon,
  Sun,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useExpenses } from "@/context/ExpenseContext";
import { createClient } from "@/utils/supabase/client";
import {
  useLanguage,
  type Language,
  type TranslationKey,
} from "@/context/LanguageContext";

type NavItem = {
  href: string;
  labelKey: TranslationKey;
  titleKey: TranslationKey;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  {
    href: "/",
    labelKey: "navDashboard",
    titleKey: "navDashboard",
    icon: ChartColumnBig,
  },
  {
    href: "/add",
    labelKey: "navAddEntry",
    titleKey: "navAddEntry",
    icon: CirclePlus,
  },
  {
    href: "/members",
    labelKey: "navMembers",
    titleKey: "membersTitle",
    icon: Users,
  },
  {
    href: "/joint-account",
    labelKey: "navJoint",
    titleKey: "jointAccountTitle",
    icon: HandCoins,
  },
];

const pathTitleKeys: Record<string, TranslationKey> = {
  "/": "navDashboard",
  "/add": "navAddEntry",
  "/members": "membersTitle",
  "/joint-account": "jointAccountTitle",
};

function getPageTitleKey(pathname: string): TranslationKey {
  if (pathTitleKeys[pathname]) {
    return pathTitleKeys[pathname];
  }
  if (pathname.startsWith("/members/")) {
    return "membersTitle";
  }
  return "budgetTracker";
}

function HeaderControls() {
  const { setTheme, resolvedTheme } = useTheme();
  const { currentLanguage, setCurrentLanguage, t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <div className="flex items-center gap-2">
      {!mounted ? (
        <div
          className="inline-flex h-9 w-9 shrink-0 rounded-lg border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800"
          aria-hidden
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            const actuallyDark =
              document.documentElement.classList.contains("dark");
            setTheme(actuallyDark ? "light" : "dark");
          }}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200"
          aria-label={t("themeToggle")}
        >
          {isDark ? (
            <Sun className="h-4 w-4" aria-hidden />
          ) : (
            <Moon className="h-4 w-4" aria-hidden />
          )}
        </button>
      )}
      <select
        value={currentLanguage}
        onChange={(event) => setCurrentLanguage(event.target.value as Language)}
        className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200"
        aria-label={t("language")}
      >
        <option value="en">EN</option>
        <option value="tr">TR</option>
        <option value="it">IT</option>
      </select>
    </div>
  );
}

function LoginScreen({ contextError }: { contextError: string | null }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setSubmitting(false);

    if (error) {
      setErrorMessage(error.message || t("signInFailed"));
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-slate-100";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <HeaderControls />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
          {t("appTitle")}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {t("signInSubtitle")}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm dark:border-gray-700 dark:bg-gray-900"
      >
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            {t("email")}
          </span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            {t("password")}
          </span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />
        </label>

        {(errorMessage || contextError) && (
          <p className="text-xs font-medium text-red-600 dark:text-red-400">
            {errorMessage ?? contextError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          {submitting ? t("signingIn") : t("signInButton")}
        </button>
      </form>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const activeTitle = t(getPageTitleKey(pathname));

  const { currentUser, selectedMonth, setSelectedMonth, signOut, loading, error } =
    useExpenses();

  if (loading) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md items-center justify-center bg-slate-50 px-6 text-center dark:bg-gray-950">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("loading")}</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen contextError={error} />;
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-slate-50 text-slate-900 dark:bg-gray-950 dark:text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-base font-semibold text-slate-900 dark:text-white">
            {activeTitle}
          </h1>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => signOut()}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 dark:border-gray-700 dark:text-slate-300"
            >
              <LogOut className="h-3.5 w-3.5" />
              {t("logout")}
            </button>
            <HeaderControls />
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            {t("activeMonth")}
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-blue-500 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-slate-100"
          />
        </div>
      </header>

      <main className="flex-1 px-4 py-5 pb-24">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md border-t border-slate-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <ul className="grid grid-cols-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/members" && pathname.startsWith("/members"));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1 py-2 text-xs ${
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[11px]">{t(item.labelKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
