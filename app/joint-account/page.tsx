"use client";

import { useExpenses } from "@/context/ExpenseContext";
import { Trash2 } from "lucide-react";

export default function JointAccountPage() {
  const { expenses, deleteExpense, selectedMonth } = useExpenses();
  const ledgerExpenses = expenses.filter(
    (expense) =>
      expense.ledger === "Joint Account" &&
      expense.date.startsWith(selectedMonth),
  );

  return (
    <div className="space-y-3">
      {ledgerExpenses.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
          No expenses for this month.
        </div>
      ) : (
        ledgerExpenses.map((expense) => (
          <article
            key={expense.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">
                {expense.category}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-blue-600">
                  €{expense.amount.toFixed(2)}
                </p>
                <button
                  type="button"
                  onClick={() => deleteExpense(expense.id)}
                  aria-label="Delete expense"
                  className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500">{expense.date}</p>
            <p className="mt-2 text-sm text-slate-600">
              {expense.note || "No note added."}
            </p>
          </article>
        ))
      )}
    </div>
  );
}
