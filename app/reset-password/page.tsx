"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-slate-100";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password.length < 6) {
      setErrorMessage(t("passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage(t("passwordsMustMatch"));
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setErrorMessage(error.message || t("resetPasswordFailed"));
        return;
      }
      setSuccessMessage(t("resetPasswordSuccess"));
      setTimeout(() => {
        router.replace("/");
      }, 900);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center dark:bg-gray-950">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
          {t("resetPasswordTitle")}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {t("resetPasswordSubtitle")}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm dark:border-gray-700 dark:bg-gray-900"
      >
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            {t("newPassword")}
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
            {t("confirmNewPassword")}
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
        {successMessage && (
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {successMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          {submitting ? t("updatingPassword") : t("updatePassword")}
        </button>

        <p className="text-center text-xs text-slate-600 dark:text-slate-400">
          <Link
            href="/"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            {t("backToSignIn")}
          </Link>
        </p>
      </form>
    </div>
  );
}
