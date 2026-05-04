"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, KeyRound } from "lucide-react";
import { useState } from "react";
import { useExpenses } from "@/context/ExpenseContext";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/utils/supabase/client";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { currentUser, refresh } = useExpenses();
  const [supabase] = useState(() => createClient());

  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [joinId, setJoinId] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinNotice, setJoinNotice] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!currentUser) return;

    const trimmed = createName.trim();
    if (!trimmed) return;

    setCreating(true);
    setCreateError(null);
    try {
      const { error: createErrorFromRpc } = await supabase.rpc(
        "create_household_and_join",
        { p_name: trimmed },
      );

      if (createErrorFromRpc) {
        throw new Error(createErrorFromRpc.message);
      }

      await refresh();
      router.push("/");
    } catch (err) {
      if (err instanceof Error) {
        const isDuplicateName =
          /duplicate key/i.test(err.message) ||
          /households_name_unique_idx/i.test(err.message) ||
          /already uses that name/i.test(err.message);
        if (isDuplicateName) {
          setCreateError(t("onboardingNameTaken"));
        } else {
          setCreateError(err.message);
        }
      } else {
        setCreateError(t("onboardingCreateFailed"));
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(event: React.FormEvent) {
    event.preventDefault();
    if (!currentUser) return;

    const trimmed = joinId.trim();
    if (!trimmed) {
      setJoinError(t("onboardingJoinNameRequired"));
      return;
    }
    if (!UUID_REGEX.test(trimmed)) {
      setJoinError(t("onboardingInvalidHouseholdId"));
      return;
    }

    setJoining(true);
    setJoinError(null);
    setJoinNotice(null);
    try {
      const { error: memberError } = await supabase
        .from("household_members")
        .insert({
          user_id: currentUser.id,
          household_id: trimmed,
          role: "member",
        });

      if (memberError) {
        const isDuplicate =
          memberError.code === "23505" ||
          /duplicate key/i.test(memberError.message);
        const isFkMissing =
          memberError.code === "23503" ||
          /foreign key/i.test(memberError.message);

        if (isDuplicate) {
          setJoinNotice(t("onboardingAlreadyMember"));
        } else if (isFkMissing) {
          setJoinError(t("cannotJoinHouseholdNotExists"));
          return;
        } else {
          throw new Error(memberError.message);
        }
      }

      const { error: switchError } = await supabase.rpc(
        "switch_active_household",
        { p_household_id: trimmed },
      );

      if (switchError) {
        throw new Error(switchError.message);
      }

      await refresh();
      router.push("/");
    } catch (err) {
      setJoinError(
        err instanceof Error ? err.message : t("onboardingJoinFailed"),
      );
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 md:py-10">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("onboardingBackToApp")}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
          {t("onboardingTitle")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("onboardingSubtitle")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-slate-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-semibold">
              {t("onboardingCreateTitle")}
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("onboardingCreateSubtitle")}
          </p>

          <label className="mt-4 block text-xs font-medium text-slate-600 dark:text-slate-400">
            {t("householdName")}
          </label>
          <input
            type="text"
            value={createName}
            onChange={(event) => setCreateName(event.target.value)}
            placeholder={t("onboardingNamePlaceholder")}
            maxLength={100}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-100"
            required
          />

          {createError && (
            <p className="mt-3 text-xs text-red-600 dark:text-red-400">
              {createError}
            </p>
          )}

          <button
            type="submit"
            disabled={creating || !createName.trim()}
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-gray-700"
          >
            {creating
              ? t("onboardingCreating")
              : t("onboardingCreateAction")}
          </button>
        </form>

        <form
          onSubmit={handleJoin}
          className="rounded-xl border border-slate-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <KeyRound className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-semibold">
              {t("onboardingJoinTitle")}
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("onboardingJoinSubtitle")}
          </p>

          <label className="mt-4 block text-xs font-medium text-slate-600 dark:text-slate-400">
            {t("onboardingJoinPlaceholder")}
          </label>
          <input
            type="text"
            value={joinId}
            onChange={(event) => setJoinId(event.target.value)}
            placeholder={t("onboardingJoinIdPlaceholder")}
            spellCheck={false}
            autoComplete="off"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 outline-none ring-emerald-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-100"
            required
          />

          {joinNotice && (
            <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400">
              {joinNotice}
            </p>
          )}
          {joinError && (
            <p className="mt-3 text-xs text-red-600 dark:text-red-400">
              {joinError}
            </p>
          )}

          <button
            type="submit"
            disabled={joining || !joinId.trim()}
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-gray-700"
          >
            {joining ? t("onboardingJoining") : t("onboardingJoinAction")}
          </button>
        </form>
      </div>
    </div>
  );
}
