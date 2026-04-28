"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, Lock, UserRound } from "lucide-react";
import { useExpenses } from "@/context/ExpenseContext";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/utils/supabase/client";

const cardClass =
  "rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-slate-100";

export default function SettingsPage() {
  const { currentUser } = useExpenses();
  const { t } = useLanguage();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) {
        setEmail(data.user?.email ?? "");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4 md:space-y-6">
      <section className={cardClass}>
        <header className="flex items-center gap-2">
          <UserRound className="h-4 w-4 text-slate-500" aria-hidden />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {t("settingsAccountSection")}
          </h2>
        </header>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {t("settingsAccountSubtitle")}
        </p>

        <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("settingsDisplayName")}
            </dt>
            <dd className="mt-1 text-slate-900 dark:text-slate-100">
              {currentUser?.display_name ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("settingsEmail")}
            </dt>
            <dd className="mt-1 break-all text-slate-900 dark:text-slate-100">
              {email || "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className={cardClass}>
        <header className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-slate-500" aria-hidden />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {t("settingsSecuritySection")}
          </h2>
        </header>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {t("settingsSecuritySubtitle")}
        </p>

        <ChangePasswordForm email={email} />
      </section>
    </div>
  );
}

function ChangePasswordForm({ email }: { email: string }) {
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage(t("passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage(t("passwordsMustMatch"));
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMessage(t("newPasswordSameAsCurrent"));
      return;
    }
    if (!email) {
      setErrorMessage(t("passwordUpdateFailed"));
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();

      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (reauthError) {
        setErrorMessage(t("currentPasswordWrong"));
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setErrorMessage(updateError.message || t("passwordUpdateFailed"));
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMessage(t("passwordUpdated"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        <KeyRound className="h-3.5 w-3.5" aria-hidden />
        {t("changePasswordTitle")}
      </h3>

      <PasswordField
        label={t("currentPassword")}
        autoComplete="current-password"
        value={currentPassword}
        onChange={setCurrentPassword}
        visible={showCurrent}
        onToggleVisible={() => setShowCurrent((prev) => !prev)}
      />

      <PasswordField
        label={t("newPassword")}
        autoComplete="new-password"
        value={newPassword}
        onChange={setNewPassword}
        visible={showNew}
        onToggleVisible={() => setShowNew((prev) => !prev)}
        minLength={6}
      />

      <PasswordField
        label={t("confirmNewPassword")}
        autoComplete="new-password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        visible={showNew}
        onToggleVisible={() => setShowNew((prev) => !prev)}
        minLength={6}
      />

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
        className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400 sm:w-auto sm:self-start"
      >
        {submitting ? t("updatingPassword") : t("updatePassword")}
      </button>
    </form>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggleVisible,
  autoComplete,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  autoComplete: string;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
        {label}
      </span>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} pr-10`}
        />
        <button
          type="button"
          onClick={onToggleVisible}
          aria-label={label}
          className="absolute inset-y-0 right-2 inline-flex items-center justify-center rounded-md px-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden />
          ) : (
            <Eye className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
    </label>
  );
}
