"use client";

import { useState } from "react";
import type { Expense, Ledger } from "@/types";
import { useExpenses } from "@/context/ExpenseContext";

const CATEGORY_OPTIONS = [
  "Movie subscriptions",
  "Gym",
  "Phone plans",
  "Rent",
  "Groceries",
  "Eating out",
  "Entertainment",
  "Additional expenses",
] as const;

const DEFAULT_CATEGORY = CATEGORY_OPTIONS[0];

type Currency = "EUR" | "TRY";
type AddExpenseFormProps = {
  liveExchangeRate: number;
  isFetchingLiveRate: boolean;
  isUsingFallbackRate: boolean;
};

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function AddExpenseForm({
  liveExchangeRate,
  isFetchingLiveRate,
  isUsingFallbackRate,
}: AddExpenseFormProps) {
  const { addExpense, currentUser } = useExpenses();
  const ledgerOptions: Ledger[] =
    currentUser === "Zeynep"
      ? ["Zeynep", "Joint Account"]
      : ["Ali", "Joint Account"];

  const [amount, setAmount] = useState("");
  const [ledger, setLedger] = useState<Ledger>(() =>
    currentUser === "Zeynep" ? "Zeynep" : "Ali",
  );
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORY);
  const [date, setDate] = useState<string>(() => getTodayDate());
  const [note, setNote] = useState("");
  const [currency, setCurrency] = useState<Currency>("EUR");
  const displayedExchangeRate = liveExchangeRate.toFixed(2);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!amount || !date) {
      return;
    }

    const enteredAmount = Number(amount);
    const parsedExchangeRate = Number(displayedExchangeRate);
    const isTryCurrency = currency === "TRY";

    if (isTryCurrency && (!parsedExchangeRate || parsedExchangeRate <= 0)) {
      return;
    }

    const finalAmount = isTryCurrency
      ? enteredAmount / parsedExchangeRate
      : enteredAmount;
    const conversionNote = isTryCurrency
      ? `(Spent ${enteredAmount.toFixed(2)} TL @ ${parsedExchangeRate.toFixed(
          2,
        )} rate)`
      : "";
    const mergedNote = [note.trim(), conversionNote].filter(Boolean).join(" ");

    const expense: Expense = {
      id: crypto.randomUUID(),
      amount: finalAmount,
      category,
      date,
      note: mergedNote,
      ledger,
    };

    addExpense(expense);

    setAmount("");
    setLedger(currentUser === "Zeynep" ? "Zeynep" : "Ali");
    setCategory(DEFAULT_CATEGORY);
    setDate(getTodayDate());
    setNote("");
    setCurrency("EUR");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-slate-800">Add Expense</h2>

      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Amount
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Currency
          </span>
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value as Currency)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
          >
            <option value="EUR">EUR (€)</option>
            <option value="TRY">TRY (₺)</option>
          </select>
        </label>

        {currency === "TRY" && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Exchange Rate (TRY to EUR)
            </span>
            <span className="mb-1 block text-xs text-slate-500">
              {isFetchingLiveRate
                ? "Fetching live rate..."
                : isUsingFallbackRate
                  ? "Using fallback rate."
                  : "Live rate loaded."}
            </span>
            <input
              type="text"
              readOnly
              value={displayedExchangeRate}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
            />
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Ledger
          </span>
          <select
            value={ledger}
            onChange={(event) => setLedger(event.target.value as Ledger)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
          >
            {ledgerOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Category
          </span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Date
          </span>
          <input
            type="date"
            required
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Note (optional)
          </span>
          <input
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add a short note"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
      >
        Save Expense
      </button>
    </form>
  );
}
