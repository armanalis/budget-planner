"use client";

import Link from "next/link";
import { ChevronRight, UserRound } from "lucide-react";
import { useExpenses } from "@/context/ExpenseContext";
import { useLanguage } from "@/context/LanguageContext";

export default function MembersPage() {
  const { members, currentUser } = useExpenses();
  const { t } = useLanguage();

  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-slate-400">
        {t("noMembers")}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {members.map((member) => {
        const isCurrent = currentUser?.id === member.id;
        return (
          <li key={member.id}>
            <Link
              href={`/members/${member.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-500 dark:hover:bg-gray-800"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
                    isCurrent
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                      : "bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-slate-300"
                  }`}
                >
                  <UserRound className="h-5 w-5" aria-hidden />
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {member.display_name}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
