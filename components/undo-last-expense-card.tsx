"use client";

import { useState } from "react";
import { Undo2 } from "lucide-react";
import { useExpenses } from "@/context/ExpenseContext";
import { useLanguage } from "@/context/LanguageContext";

const cardClass =
  "rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900";

export default function UndoLastExpenseCard() {
  const { canUndoLastExpense, undoLastExpense } = useExpenses();
  const { t } = useLanguage();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className={cardClass}>
      <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
        {t("undoLastExpenseSectionTitle")}
      </h2>
      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
        {t("undoLastExpenseSectionBody")}
      </p>
      <button
        type="button"
        disabled={!canUndoLastExpense || working}
        onClick={async () => {
          setError(null);
          setWorking(true);
          try {
            await undoLastExpense();
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
          } finally {
            setWorking(false);
          }
        }}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-slate-100 dark:hover:bg-gray-700"
      >
        <Undo2 className="h-4 w-4 shrink-0" aria-hidden />
        {working ? t("undoLastExpenseWorking") : t("undoLastExpenseButton")}
      </button>
      {!canUndoLastExpense && !working && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {t("undoLastExpenseUnavailable")}
        </p>
      )}
      {error && (
        <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}
