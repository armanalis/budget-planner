"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Bell,
  Check,
  ChartColumnBig,
  ChevronDown,
  CirclePlus,
  HandCoins,
  LogOut,
  MessageCircle,
  Moon,
  Plus,
  RefreshCcw,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  {
    href: "/messages",
    labelKey: "navMessages",
    titleKey: "messagesTitle",
    icon: MessageCircle,
  },
  {
    href: "/settings",
    labelKey: "navSettings",
    titleKey: "settingsTitle",
    icon: Settings,
  },
];

const pathTitleKeys: Record<string, TranslationKey> = {
  "/": "navDashboard",
  "/add": "navAddEntry",
  "/members": "membersTitle",
  "/joint-account": "jointAccountTitle",
  "/messages": "messagesTitle",
  "/notifications": "notificationsTitle",
  "/settings": "settingsTitle",
  "/onboarding": "onboardingTitle",
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

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/members") return pathname.startsWith("/members");
  if (href === "/notifications") return pathname.startsWith("/notifications");
  if (href === "/messages") return pathname.startsWith("/messages");
  if (href === "/settings") return pathname.startsWith("/settings");
  return pathname === href;
}

function HouseholdSwitcher({ variant = "sidebar" }: { variant?: "sidebar" | "header" }) {
  const { t } = useLanguage();
  const { household, myHouseholds, activeHouseholdId, switchHousehold } =
    useExpenses();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const activeName =
    household?.name ??
    myHouseholds.find((h) => h.id === activeHouseholdId)?.name ??
    "";

  async function handleSelect(id: string) {
    if (id === activeHouseholdId) {
      setOpen(false);
      return;
    }
    setBusy(true);
    try {
      await switchHousehold(id);
      setOpen(false);
    } catch {
      // The error already surfaces via the context.
    } finally {
      setBusy(false);
    }
  }

  const buttonClass =
    variant === "sidebar"
      ? "flex w-full items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-left transition hover:bg-slate-100 dark:border-gray-800 dark:bg-gray-800/60 dark:hover:bg-gray-800"
      : "flex max-w-[10rem] items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 transition hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200 dark:hover:bg-gray-700";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("switchHousehold")}
        className={buttonClass}
      >
        {variant === "sidebar" ? (
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t("householdLabel")}
            </span>
            <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
              {activeName || "—"}
            </span>
          </span>
        ) : (
          <span className="truncate font-medium">{activeName || "—"}</span>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-30 mt-1 ${variant === "sidebar" ? "left-0 right-0" : "right-0 w-56"} overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900`}
        >
          <ul className="max-h-64 overflow-y-auto py-1">
            {myHouseholds.length === 0 && (
              <li className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                —
              </li>
            )}
            {myHouseholds.map((h) => {
              const isActive = h.id === activeHouseholdId;
              return (
                <li key={h.id}>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive}
                    onClick={() => handleSelect(h.id)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition ${
                      isActive
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {isActive ? (
                        <Check className="h-4 w-4 shrink-0" aria-hidden />
                      ) : (
                        <span className="inline-block h-4 w-4 shrink-0" />
                      )}
                      <span className="truncate">{h.name}</span>
                    </span>
                    {isActive && (
                      <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {t("activeBadge")}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-slate-200 dark:border-gray-700">
            <Link
              href="/onboarding"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t("createOrJoin")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
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

function NotificationBell() {
  const { unreadNotificationCount } = useExpenses();
  const { t } = useLanguage();
  const pathname = usePathname();
  const isActive = pathname.startsWith("/notifications");

  return (
    <Link
      href="/notifications"
      aria-label={t("notificationsTitle")}
      className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200 ${
        isActive ? "ring-2 ring-blue-500" : ""
      }`}
    >
      <Bell className="h-4 w-4" aria-hidden />
      {unreadNotificationCount > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
          {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
        </span>
      )}
    </Link>
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

        <p className="text-center text-xs text-slate-600 dark:text-slate-400">
          {t("noAccountYet")}{" "}
          <Link
            href="/sign-up"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            {t("createAccountLink")}
          </Link>
        </p>
      </form>
    </div>
  );
}

function PendingApprovalScreen({
  householdName,
}: {
  householdName: string;
}) {
  const { t } = useLanguage();
  const { signOut, refresh } = useExpenses();
  const [refreshing, setRefreshing] = useState(false);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <HeaderControls />
      </div>
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t("pendingTitle")}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {householdName
            ? t("pendingBody", { household: householdName })
            : t("pendingNoHousehold")}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            disabled={refreshing}
            onClick={async () => {
              setRefreshing(true);
              try {
                await refresh();
              } finally {
                setRefreshing(false);
              }
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden />
            {t("pendingRefresh")}
          </button>
          <button
            type="button"
            onClick={() => signOut()}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200 dark:hover:bg-gray-700"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {t("pendingSignOut")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const activeTitle = t(getPageTitleKey(pathname));

  const {
    currentUser,
    selectedMonth,
    setSelectedMonth,
    signOut,
    loading,
    error,
    pendingRequest,
    isAuthenticated,
    unreadNotificationCount,
  } = useExpenses();

  if (loading) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md items-center justify-center bg-slate-50 px-6 text-center dark:bg-gray-950">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("loading")}</p>
      </div>
    );
  }

  if (!currentUser) {
    if (pathname === "/sign-up") {
      return <>{children}</>;
    }
    if (isAuthenticated && pendingRequest) {
      return (
        <PendingApprovalScreen householdName={pendingRequest.household_name} />
      );
    }
    return <LoginScreen contextError={error} />;
  }

  const monthInputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-blue-500 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-slate-100";

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 dark:bg-gray-950 dark:text-slate-100 md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-slate-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:sticky md:top-0 md:flex md:h-dvh md:w-64 md:shrink-0 md:flex-col md:p-4">
        <div className="px-2 pb-4">
          <p className="text-base font-semibold text-slate-900 dark:text-white">
            {t("appTitle")}
          </p>
          <div className="mt-2">
            <HouseholdSwitcher variant="sidebar" />
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {currentUser.display_name}
          </p>
        </div>

        <nav aria-label="Primary" className="flex-1">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = isNavItemActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                      isActive
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href="/notifications"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isNavItemActive(pathname, "/notifications")
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-gray-800"
                }`}
              >
                <Bell className="h-4 w-4" aria-hidden />
                <span className="flex-1">{t("navNotifications")}</span>
                {unreadNotificationCount > 0 && (
                  <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                    {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                  </span>
                )}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-gray-800">
          <label className="block px-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            {t("activeMonth")}
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className={`${monthInputClass} mt-1`}
          />

          <div className="mt-3 px-0">
            <HeaderControls />
          </div>

          <button
            type="button"
            onClick={() => signOut()}
            className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-2 text-xs text-slate-600 dark:border-gray-700 dark:text-slate-300"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t("logout")}
          </button>
        </div>
      </aside>

      {/* Right column: header (mobile) + main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile-only header */}
        <header className="sticky top-0 z-10 mx-auto w-full max-w-md border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90 md:hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-slate-900 dark:text-white">
                {activeTitle}
              </h1>
              <div className="mt-1">
                <HouseholdSwitcher variant="header" />
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <NotificationBell />
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 dark:border-gray-700 dark:text-slate-300"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {t("logout")}
                </button>
              </div>
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
              className={`${monthInputClass} mt-1`}
            />
          </div>
        </header>

        {/* Desktop-only header */}
        <header className="hidden border-b border-slate-200 bg-white/90 px-8 py-5 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90 md:block">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              {activeTitle}
            </h1>
            <NotificationBell />
          </div>
        </header>

        <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 pb-24 md:max-w-5xl md:px-8 md:py-8 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile-only bottom navigation */}
      <nav
        aria-label="Primary mobile"
        className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md border-t border-slate-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:hidden"
      >
        <ul className="grid grid-cols-6">
          {navItems.map((item) => {
            const isActive = isNavItemActive(pathname, item.href);
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
