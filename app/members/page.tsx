"use client";

import Link from "next/link";
import { ChevronRight, Crown, Home, UserRound } from "lucide-react";
import { useExpenses } from "@/context/ExpenseContext";
import { useLanguage } from "@/context/LanguageContext";

export default function MembersPage() {
  const { members, currentUser, household } = useExpenses();
  const { t } = useLanguage();

  const memberCount = members.length;
  const countLabel =
    memberCount === 1
      ? t("membersCount", { count: String(memberCount) })
      : t("membersCountPlural", { count: String(memberCount) });

  return (
    <div className="space-y-4">
      {household && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              <Home className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("householdLabel")}
              </p>
              <h2 className="break-words text-lg font-semibold text-slate-900 dark:text-white">
                {household.name}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {countLabel}
              </p>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                {t("inviteHint")}
              </p>
            </div>
          </div>
        </section>
      )}

      {memberCount === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-slate-400">
          {t("noMembers")}
        </div>
      ) : (
        <ul className="space-y-3">
          {members.map((member) => {
            const isCurrent = currentUser?.id === member.id;
            const isOwner = household?.created_by === member.id;
            return (
              <li key={member.id}>
                <Link
                  href={`/members/${member.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-500 dark:hover:bg-gray-800"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        isCurrent
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          : "bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-slate-300"
                      }`}
                    >
                      <UserRound className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {member.display_name}
                      </p>
                      {isOwner && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          <Crown className="h-3 w-3" aria-hidden />
                          {t("ownerBadge")}
                        </span>
                      )}
                      {isCurrent && (
                        <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          {t("youBadge")}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-slate-400"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
