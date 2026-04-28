"use client";

import { use } from "react";
import { Trash2 } from "lucide-react";
import { useExpenses } from "@/context/ExpenseContext";
import {
  translateExpenseCategory,
  useLanguage,
} from "@/context/LanguageContext";

const cardClass =
  "rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900";

export default function MemberLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { expenses, members, deleteExpense, currentUser, selectedMonth } =
    useExpenses();
  const { t } = useLanguage();

  const member = members.find((m) => m.id === id);
  const ledgerExpenses = expenses.filter(
    (expense) =>
      expense.user_id === id && expense.date.startsWith(selectedMonth),
  );
  const canDelete = currentUser?.id === id;
  const hasExpenses = ledgerExpenses.length > 0;

  return (
    <div className="space-y-3 md:space-y-4">
      {member && (
        <div className={cardClass}>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t("membersTitle")}
          </p>
          <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
            {member.display_name}
          </p>
        </div>
      )}

      {!canDelete && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
          {t("viewOnly")}
        </div>
      )}

      {!hasExpenses && (
        <div className={`${cardClass} text-sm text-slate-500 dark:text-slate-400`}>
          {t("noExpensesThisMonth")}
        </div>
      )}

      {/* Mobile: stacked cards */}
      {hasExpenses && (
        <div className="space-y-3 md:hidden">
          {ledgerExpenses.map((expense) => (
            <article key={expense.id} className={cardClass}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {translateExpenseCategory(t, expense.category)}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    €{expense.amount.toFixed(2)}
                  </p>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => deleteExpense(expense.id)}
                      aria-label={t("deleteExpense")}
                      className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-gray-800 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {expense.date}
                {expense.is_joint ? ` · ${t("jointAccountTitle")}` : ""}
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {expense.note || t("noNote")}
              </p>
            </article>
          ))}
        </div>
      )}

      {/* Desktop: table */}
      {hasExpenses && (
        <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900 md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-gray-800/60 dark:text-slate-400">
              <tr>
                <th scope="col" className="px-4 py-3">
                  {t("date")}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t("category")}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t("note")}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {t("amount")}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  <span className="sr-only">{t("actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-gray-800">
              {ledgerExpenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="hover:bg-slate-50 dark:hover:bg-gray-800/40"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">
                    {expense.date}
                    {expense.is_joint && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                        {t("jointAccountTitle")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-200">
                    {translateExpenseCategory(t, expense.category)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {expense.note || t("noNote")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-blue-600 dark:text-blue-400">
                    €{expense.amount.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {canDelete ? (
                      <button
                        type="button"
                        onClick={() => deleteExpense(expense.id)}
                        aria-label={t("deleteExpense")}
                        className="inline-flex items-center justify-center rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-gray-800 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <span aria-hidden className="text-slate-300 dark:text-gray-700">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
