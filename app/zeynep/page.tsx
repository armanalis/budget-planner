"use client";

import { useExpenses } from "@/context/ExpenseContext";
import {
  translateExpenseCategory,
  useLanguage,
} from "@/context/LanguageContext";
import { Trash2 } from "lucide-react";

const cardClass =
  "rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900";

export default function ZeynepPage() {
  const { expenses, deleteExpense, currentUser, selectedMonth } = useExpenses();
  const { t } = useLanguage();
  const ledgerExpenses = expenses.filter(
    (expense) =>
      expense.ledger === "Zeynep" && expense.date.startsWith(selectedMonth),
  );
  const canDelete = currentUser === "Zeynep";

  return (
    <div className="space-y-3">
      {!canDelete && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
          {t("viewOnly")}
        </div>
      )}
      {ledgerExpenses.length === 0 ? (
        <div className={`${cardClass} text-sm text-slate-500 dark:text-slate-400`}>
          {t("noExpensesThisMonth")}
        </div>
      ) : (
        ledgerExpenses.map((expense) => (
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
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {expense.note || t("noNote")}
            </p>
          </article>
        ))
      )}
    </div>
  );
}
