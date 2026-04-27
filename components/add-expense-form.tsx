"use client";

import { useState } from "react";
import type { NewExpenseInput } from "@/types";
import { useExpenses } from "@/context/ExpenseContext";
import {
  CATEGORY_TO_I18N_KEY,
  EXPENSE_CATEGORY_ENGLISH,
  useLanguage,
  type ExpenseCategoryEnglish,
} from "@/context/LanguageContext";

const DEFAULT_CATEGORY: ExpenseCategoryEnglish = EXPENSE_CATEGORY_ENGLISH[0];

const JOINT_OPTION_VALUE = "__joint__";

type Currency = "EUR" | "TRY";
type AddExpenseFormProps = {
  liveExchangeRate: number;
  isFetchingLiveRate: boolean;
  isUsingFallbackRate: boolean;
};

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

const inputClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-slate-100";

export default function AddExpenseForm({
  liveExchangeRate,
  isFetchingLiveRate,
  isUsingFallbackRate,
}: AddExpenseFormProps) {
  const { addExpense, currentUser, members } = useExpenses();
  const { t } = useLanguage();

  const [amount, setAmount] = useState("");
  const [ledger, setLedger] = useState<string>(() => currentUser?.id ?? "");
  const [category, setCategory] =
    useState<ExpenseCategoryEnglish>(DEFAULT_CATEGORY);
  const [date, setDate] = useState<string>(() => getTodayDate());
  const [note, setNote] = useState("");
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const displayedExchangeRate = liveExchangeRate.toFixed(2);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!amount || !date || !currentUser) {
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

    const isJoint = ledger === JOINT_OPTION_VALUE;
    const userId = isJoint ? currentUser.id : ledger || currentUser.id;

    const input: NewExpenseInput = {
      amount: finalAmount,
      category,
      date,
      note: mergedNote,
      user_id: userId,
      is_joint: isJoint,
    };

    try {
      setSubmitting(true);
      setSubmitError(null);
      await addExpense(input);

      setAmount("");
      setLedger(currentUser.id);
      setCategory(EXPENSE_CATEGORY_ENGLISH[0]);
      setDate(getTodayDate());
      setNote("");
      setCurrency("EUR");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
    >
      <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
        {t("addExpense")}
      </h2>

      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            {t("amount")}
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            className={inputClassName}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            {t("currency")}
          </span>
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value as Currency)}
            className={inputClassName}
          >
            <option value="EUR">{t("currencyEur")}</option>
            <option value="TRY">{t("currencyTry")}</option>
          </select>
        </label>

        {currency === "TRY" && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t("exchangeRateTryEur")}
            </span>
            <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
              {isFetchingLiveRate
                ? t("fetchingLiveRate")
                : isUsingFallbackRate
                  ? t("usingFallbackRate")
                  : t("liveRateLoaded")}
            </span>
            <input
              type="text"
              readOnly
              value={displayedExchangeRate}
              className={inputClassName}
            />
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            {t("ledger")}
          </span>
          <select
            value={ledger}
            onChange={(event) => setLedger(event.target.value)}
            className={inputClassName}
          >
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.display_name}
              </option>
            ))}
            <option value={JOINT_OPTION_VALUE}>{t("jointAccountTitle")}</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            {t("category")}
          </span>
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as ExpenseCategoryEnglish)
            }
            className={inputClassName}
          >
            {EXPENSE_CATEGORY_ENGLISH.map((option) => (
              <option key={option} value={option}>
                {t(CATEGORY_TO_I18N_KEY[option])}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            {t("date")}
          </span>
          <input
            type="date"
            required
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={inputClassName}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            {t("noteOptional")}
          </span>
          <input
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t("notePlaceholder")}
            className={inputClassName}
          />
        </label>
      </div>

      {submitError && (
        <p className="mt-3 text-xs font-medium text-red-600 dark:text-red-400">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !currentUser}
        className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
      >
        {t("saveExpense")}
      </button>
    </form>
  );
}
