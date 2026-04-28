"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useExpenses } from "@/context/ExpenseContext";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/utils/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const { t, currentLanguage, setCurrentLanguage } = useLanguage();
  const { currentUser, loading } = useExpenses();

  const [displayName, setDisplayName] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "callback") {
      setErrorMessage(t("signUpCallbackFailed"));
      return;
    }
    if (params.get("error") === "provision") {
      setErrorMessage(t("signUpProvisionFailed"));
    }
  }, [t]);

  useEffect(() => {
    if (!loading && currentUser) {
      router.replace("/");
    }
  }, [loading, currentUser, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage(t("passwordsMustMatch"));
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t("passwordTooShort"));
      return;
    }

    setSubmitting(true);

    const supabase = createClient();
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          display_name:
            displayName.trim() ||
            email.trim().split("@")[0] ||
            "Member",
          household_name: householdName.trim() || "Household",
        },
      },
    });

    setSubmitting(false);

    if (error) {
      setErrorMessage(error.message || t("signUpFailed"));
      return;
    }

    if (data.session) {
      router.replace("/");
      return;
    }

    setVerificationSent(true);
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-slate-100";

  if (!loading && currentUser) {
    return (
      <div className="mx-auto flex min-h-dvh items-center justify-center bg-slate-50 px-6 dark:bg-gray-950">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center dark:bg-gray-950">
      <div className="flex w-full max-w-sm items-center justify-between gap-3">
        <Link
          href="/"
          className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          ← {t("backToSignIn")}
        </Link>
        <SignUpHeaderControls
          currentLanguage={currentLanguage}
          setCurrentLanguage={setCurrentLanguage}
        />
      </div>

      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
          {t("signUpTitle")}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {t("signUpSubtitle")}
        </p>
      </div>

      {verificationSent ? (
        <div className="w-full max-w-sm rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100">
          <p className="font-medium">{t("checkEmailTitle")}</p>
          <p className="mt-2 text-emerald-800 dark:text-emerald-200/90">
            {t("checkEmailBody")}
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            {t("backToSignIn")}
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-sm flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t("displayName")}
            </span>
            <input
              type="text"
              autoComplete="name"
              required
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className={inputClass}
              placeholder={t("displayNamePlaceholder")}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t("householdName")}
            </span>
            <input
              type="text"
              autoComplete="organization"
              required
              value={householdName}
              onChange={(event) => setHouseholdName(event.target.value)}
              className={inputClass}
              placeholder={t("householdNamePlaceholder")}
            />
          </label>

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
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t("confirmPassword")}
            </span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={inputClass}
            />
          </label>

          {errorMessage && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            {submitting ? t("creatingAccount") : t("signUpButton")}
          </button>

          <p className="text-center text-xs text-slate-600 dark:text-slate-400">
            {t("alreadyHaveAccount")}{" "}
            <Link
              href="/"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              {t("signInInstead")}
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}

function SignUpHeaderControls({
  currentLanguage,
  setCurrentLanguage,
}: {
  currentLanguage: "en" | "tr" | "it";
  setCurrentLanguage: (lang: "en" | "tr" | "it") => void;
}) {
  const { setTheme, resolvedTheme } = useTheme();
  const { t } = useLanguage();
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
        onChange={(event) =>
          setCurrentLanguage(event.target.value as "en" | "tr" | "it")
        }
        className="h-9 min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200"
        aria-label={t("language")}
      >
        <option value="en">EN</option>
        <option value="tr">TR</option>
        <option value="it">IT</option>
      </select>
    </div>
  );
}
