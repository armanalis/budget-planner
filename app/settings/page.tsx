"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Home,
  KeyRound,
  Layers,
  Lock,
  RefreshCcw,
  Repeat,
  Trash2,
  UserRound,
  Wallet,
} from "lucide-react";
import type {
  Budget,
  Expense,
  Member,
  RecurringExpense,
  SubcategoryBudget,
} from "@/types";
import { useExpenses } from "@/context/ExpenseContext";
import {
  formatExpenseCategoryDisplay,
  MAIN_CATEGORY_ENGLISH,
  translateMainCategory,
  useLanguage,
  type MainCategoryEnglish,
} from "@/context/LanguageContext";
import { createClient } from "@/utils/supabase/client";

const CSV_HEADER = "Date,Amount,Category,Paid By,Note,Joint\n";

function escapeCsvField(value: string | number | boolean): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildExpensesCsv(expenses: Expense[], members: Member[]): string {
  const memberNameById = new Map(members.map((m) => [m.id, m.display_name]));

  const rows = expenses.map((expense) => {
    const paidBy = memberNameById.get(expense.user_id) ?? expense.user_id;
    return [
      expense.date,
      expense.amount.toFixed(2),
      expense.category,
      paidBy,
      expense.note ?? "",
      expense.is_joint ? "Yes" : "No",
    ]
      .map(escapeCsvField)
      .join(",");
  });

  return CSV_HEADER + rows.join("\n");
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["\ufeff", csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const cardClass =
  "rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-slate-100";

export default function SettingsPage() {
  const {
    currentUser,
    expenses,
    members,
    budgets,
    subcategoryBudgets,
    supportsExpenseHierarchy,
    supportsSubcategoryBudgetTable,
    updateBudget,
    upsertSubcategoryBudget,
    deleteSubcategoryBudget,
    household,
    activeRole,
    renameHousehold,
    deleteActiveHousehold,
    recurringExpenses,
    deleteRecurringExpense,
    processRecurringExpenses,
    myHouseholds,
  } = useExpenses();
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

  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    const csv = buildExpensesCsv(expenses, members);
    downloadCsv("budget_export.csv", csv);
  };

  const exportDisabled = expenses.length === 0;

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
          <Home className="h-4 w-4 text-slate-500" aria-hidden />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {t("settingsHouseholdSection")}
          </h2>
        </header>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {t("settingsHouseholdSubtitle")}
        </p>

        {activeRole === "owner" ? (
          <div className="space-y-4">
            <RenameHouseholdForm
              key={household?.name ?? ""}
              currentName={household?.name ?? ""}
              renameHousehold={renameHousehold}
            />
            <DeleteHouseholdForm
              key={`delete-${household?.id ?? ""}`}
              deleteActiveHousehold={deleteActiveHousehold}
            />
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("householdLabel")}
            </p>
            <p className="text-sm text-slate-900 dark:text-slate-100">
              {household?.name ?? "—"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("settingsHouseholdOwnerOnly")}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("settingsOnlyOwnersCanDeleteHousehold")}
            </p>
          </div>
        )}
      </section>

      <section className={cardClass}>
        <header className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-slate-500" aria-hidden />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {t("settingsMoreHouseholdsSection")}
          </h2>
        </header>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {t("settingsMoreHouseholdsBody")}
        </p>
        <p className="mt-2 text-xs font-medium text-slate-700 dark:text-slate-300">
          {t("settingsMembershipSummary", {
            count: String(myHouseholds.length),
          })}
        </p>
        <Link
          href="/onboarding"
          className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 transition hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-100 dark:hover:bg-blue-900/40 sm:w-auto"
        >
          {t("createOrJoinAnother")}
        </Link>
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

      <section className={cardClass}>
        <header className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-slate-500" aria-hidden />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {t("exportDataTitle")}
          </h2>
        </header>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {t("exportDataSubtitle")}
        </p>

        {exportDisabled ? (
          <p className="mt-3 text-xs italic text-slate-500 dark:text-slate-400">
            {t("exportEmpty")}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={exportDisabled}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400 sm:w-auto"
        >
          <Download className="h-4 w-4" aria-hidden />
          {t("downloadCSV")}
        </button>
      </section>

      <BudgetsSection
        budgets={budgets}
        subcategoryBudgets={subcategoryBudgets}
        supportsExpenseHierarchy={supportsExpenseHierarchy}
        supportsSubcategoryBudgetTable={supportsSubcategoryBudgetTable}
        updateBudget={updateBudget}
        upsertSubcategoryBudget={upsertSubcategoryBudget}
        deleteSubcategoryBudget={deleteSubcategoryBudget}
      />

      <RecurringExpensesSection
        recurringExpenses={recurringExpenses}
        members={members}
        deleteRecurringExpense={deleteRecurringExpense}
        processRecurringExpenses={processRecurringExpenses}
      />
    </div>
  );
}

function RecurringExpensesSection({
  recurringExpenses,
  members,
  deleteRecurringExpense,
  processRecurringExpenses,
}: {
  recurringExpenses: RecurringExpense[];
  members: Member[];
  deleteRecurringExpense: (id: string) => Promise<void>;
  processRecurringExpenses: () => Promise<{ processedCount: number }>;
}) {
  const { t } = useLanguage();
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    kind: "success" | "info" | "error";
    text: string;
  } | null>(null);

  const memberNameById = useMemo(
    () => new Map(members.map((m) => [m.id, m.display_name])),
    [members],
  );

  const handleProcess = async () => {
    setStatusMessage(null);
    setProcessing(true);
    try {
      const { processedCount } = await processRecurringExpenses();
      if (processedCount > 0) {
        setStatusMessage({
          kind: "success",
          text: t("recurringProcessSuccess"),
        });
      } else {
        setStatusMessage({
          kind: "info",
          text: t("recurringProcessNothing"),
        });
      }
    } catch (err) {
      setStatusMessage({
        kind: "error",
        text:
          err instanceof Error
            ? err.message
            : t("recurringProcessFailed"),
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <section className={cardClass}>
      <header className="flex items-center gap-2">
        <Repeat className="h-4 w-4 text-slate-500" aria-hidden />
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          {t("recurringSectionTitle")}
        </h2>
      </header>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {t("recurringSectionSubtitle")}
      </p>

      <button
        type="button"
        onClick={handleProcess}
        disabled={processing}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400 sm:w-auto"
      >
        <RefreshCcw className="h-4 w-4" aria-hidden />
        {processing ? t("recurringProcessing") : t("recurringProcessButton")}
      </button>

      {statusMessage && (
        <p
          className={`mt-2 text-xs font-medium ${
            statusMessage.kind === "success"
              ? "text-emerald-600 dark:text-emerald-400"
              : statusMessage.kind === "error"
                ? "text-red-600 dark:text-red-400"
                : "text-slate-500 dark:text-slate-400"
          }`}
          role="status"
        >
          {statusMessage.text}
        </p>
      )}

      {recurringExpenses.length === 0 ? (
        <p className="mt-4 text-xs italic text-slate-500 dark:text-slate-400">
          {t("recurringEmpty")}
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100 dark:divide-gray-800">
          {recurringExpenses.map((row) => (
            <RecurringExpenseRow
              key={row.id}
              row={row}
              payerName={memberNameById.get(row.user_id) ?? "—"}
              onDelete={deleteRecurringExpense}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function RecurringExpenseRow({
  row,
  payerName,
  onDelete,
}: {
  row: RecurringExpense;
  payerName: string;
  onDelete: (id: string) => Promise<void>;
}) {
  const { t } = useLanguage();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(row.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <li className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {formatExpenseCategoryDisplay(t, row)}{" "}
          <span className="font-normal text-slate-500 dark:text-slate-400">
            · €{row.amount.toFixed(2)}
          </span>
        </p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {row.is_joint ? t("jointAccountTitle") : payerName}
          {" · "}
          {t("recurringNextRun")}: {row.next_process_month}
        </p>
        {row.note && (
          <p className="mt-1 truncate text-xs text-slate-600 dark:text-slate-300">
            {row.note}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        aria-label={t("recurringDelete")}
        className="shrink-0 rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-400 dark:hover:bg-gray-800 dark:hover:text-red-400"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    </li>
  );
}

function BudgetsSection({
  budgets,
  subcategoryBudgets,
  supportsExpenseHierarchy,
  supportsSubcategoryBudgetTable,
  updateBudget,
  upsertSubcategoryBudget,
  deleteSubcategoryBudget,
}: {
  budgets: Budget[];
  subcategoryBudgets: SubcategoryBudget[];
  supportsExpenseHierarchy: boolean;
  supportsSubcategoryBudgetTable: boolean;
  updateBudget: (category: string, limitAmount: number) => Promise<void>;
  upsertSubcategoryBudget: (
    mainCategory: string,
    subCategory: string,
    limitAmount: number,
  ) => Promise<void>;
  deleteSubcategoryBudget: (
    mainCategory: string,
    subCategory: string,
  ) => Promise<void>;
}) {
  const { t } = useLanguage();
  const budgetByCategory = useMemo(() => {
    const map = new Map<string, Budget>();
    for (const budget of budgets) {
      map.set(budget.category, budget);
    }
    return map;
  }, [budgets]);
  const subByMain = useMemo(() => {
    const map = new Map<string, SubcategoryBudget[]>();
    for (const row of subcategoryBudgets) {
      const existing = map.get(row.main_category) ?? [];
      existing.push(row);
      map.set(row.main_category, existing);
    }
    for (const [key, rows] of map.entries()) {
      rows.sort((a, b) => a.sub_category.localeCompare(b.sub_category));
      map.set(key, rows);
    }
    return map;
  }, [subcategoryBudgets]);

  const showSubcategoryBudgetUi =
    supportsExpenseHierarchy && supportsSubcategoryBudgetTable;

  return (
    <section className={cardClass}>
      <header className="flex items-center gap-2">
        <Wallet className="h-4 w-4 text-slate-500" aria-hidden />
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          {t("budgetsTitle")}
        </h2>
      </header>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {t("budgetsSubtitle")}
      </p>

      {(!supportsExpenseHierarchy || !supportsSubcategoryBudgetTable) && (
        <div className="mt-3 space-y-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          {!supportsExpenseHierarchy ? (
            <p>{t("dbSchemaLegacyExpenseHint")}</p>
          ) : null}
          {!supportsSubcategoryBudgetTable ? (
            <p>{t("settingsSubcategoryBudgetNeedsMigration")}</p>
          ) : null}
        </div>
      )}

      <p className="mt-3 text-xs font-medium text-slate-700 dark:text-slate-300">
        {t("budgetMainCategoriesTitle")}
      </p>

      <ul className="mt-4 divide-y divide-slate-100 dark:divide-gray-800">
        {MAIN_CATEGORY_ENGLISH.map((category) => (
          <li key={category} className="py-3 first:pt-0 last:pb-0">
            <BudgetRow
              key={`${category}-${budgetByCategory.get(category)?.id ?? "none"}-${budgetByCategory.get(category)?.limit_amount ?? "0"}`}
              category={category}
              existing={budgetByCategory.get(category)}
              subcategoryRows={subByMain.get(category) ?? []}
              showSubcategoryBudgetUi={showSubcategoryBudgetUi}
              updateBudget={updateBudget}
              upsertSubcategoryBudget={upsertSubcategoryBudget}
              deleteSubcategoryBudget={deleteSubcategoryBudget}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function BudgetRow({
  category,
  existing,
  subcategoryRows,
  showSubcategoryBudgetUi,
  updateBudget,
  upsertSubcategoryBudget,
  deleteSubcategoryBudget,
}: {
  category: MainCategoryEnglish;
  existing: Budget | undefined;
  subcategoryRows: SubcategoryBudget[];
  showSubcategoryBudgetUi: boolean;
  updateBudget: (category: string, limitAmount: number) => Promise<void>;
  upsertSubcategoryBudget: (
    mainCategory: string,
    subCategory: string,
    limitAmount: number,
  ) => Promise<void>;
  deleteSubcategoryBudget: (
    mainCategory: string,
    subCategory: string,
  ) => Promise<void>;
}) {
  const { t } = useLanguage();
  const [value, setValue] = useState<string>(
    existing ? existing.limit_amount.toString() : "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subName, setSubName] = useState("");
  const [subLimit, setSubLimit] = useState("");
  const [submittingSub, setSubmittingSub] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const mainLimit = Number.parseFloat(value || "0");
  const allocatedSubTotal = subcategoryRows.reduce(
    (sum, row) => sum + row.limit_amount,
    0,
  );

  const handleSubmit = async () => {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Invalid amount");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await updateBudget(category, parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSub = async () => {
    const parsed = Number.parseFloat(subLimit);
    const normalized = subName.trim();
    if (!normalized) {
      setSubError(t("budgetSubcategoryName"));
      return;
    }
    if (!Number.isFinite(parsed) || parsed < 0) {
      setSubError("Invalid amount");
      return;
    }
    setSubmittingSub(true);
    setSubError(null);
    try {
      await upsertSubcategoryBudget(category, normalized, parsed);
      setSubName("");
      setSubLimit("");
    } catch (err) {
      setSubError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmittingSub(false);
    }
  };

  const handleDeleteSub = async (subCategory: string) => {
    setDeletingKey(subCategory);
    setSubError(null);
    try {
      await deleteSubcategoryBudget(category, subCategory);
    } catch (err) {
      setSubError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingKey(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <p className="min-w-0 flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">
          {translateMainCategory(t, category)}
        </p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-sm text-slate-400">
              €
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="0.00"
              className={`${inputClass} w-32 pl-6 tabular-nums`}
            />
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            {submitting ? t("saving") : t("setLimit")}
          </button>
        </div>
      </div>
      {error && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400 sm:basis-full">
          {error}
        </p>
      )}

      {showSubcategoryBudgetUi ? (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-gray-700 dark:bg-gray-800/40">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            {t("budgetSubcategoriesTitle")}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {t("budgetAllocated")}: €{allocatedSubTotal.toFixed(2)}
            {Number.isFinite(mainLimit) && mainLimit > 0
              ? ` / €${mainLimit.toFixed(2)}`
              : ""}
          </p>
        </div>

        {category === "Other" && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {t("budgetOverflowOtherHint")}
          </p>
        )}

        {subcategoryRows.length === 0 ? (
          <p className="mt-2 text-xs italic text-slate-500 dark:text-slate-400">
            {t("budgetNoSubcategories")}
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {subcategoryRows.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-900"
              >
                <span className="text-slate-700 dark:text-slate-200">
                  {row.sub_category} · €{row.limit_amount.toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteSub(row.sub_category)}
                  disabled={deletingKey === row.sub_category}
                  className="text-red-600 transition hover:text-red-500 disabled:opacity-60 dark:text-red-400 dark:hover:text-red-300"
                >
                  {t("deleteExpense")}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
          <input
            type="text"
            value={subName}
            onChange={(event) => setSubName(event.target.value)}
            placeholder={t("budgetSubcategoryName")}
            className={inputClass}
          />
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-sm text-slate-400">
              €
            </span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={subLimit}
              onChange={(event) => setSubLimit(event.target.value)}
              placeholder="0.00"
              className={`${inputClass} pl-6`}
            />
          </div>
          <button
            type="button"
            onClick={handleAddSub}
            disabled={submittingSub}
            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-500 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            {submittingSub ? t("saving") : t("budgetAddSubcategory")}
          </button>
        </div>

        {subError && (
          <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
            {subError}
          </p>
        )}
      </div>
      ) : null}
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

function RenameHouseholdForm({
  currentName,
  renameHousehold,
}: {
  currentName: string;
  renameHousehold: (newName: string) => Promise<void>;
}) {
  const { t } = useLanguage();
  const [name, setName] = useState(currentName);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const trimmed = name.trim();
  const unchanged =
    trimmed.length === 0 || trimmed === currentName.trim();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (unchanged) {
      setErrorMessage(t("settingsHouseholdNameUnchanged"));
      return;
    }

    setSubmitting(true);
    try {
      await renameHousehold(trimmed);
      setName(trimmed);
      setSuccessMessage(t("settingsHouseholdRenamed"));
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      const lower = raw.toLowerCase();
      if (lower.includes("already uses")) {
        setErrorMessage(t("settingsHouseholdNameTaken"));
      } else if (lower.includes("only the household owner")) {
        setErrorMessage(t("settingsHouseholdOwnerOnly"));
      } else {
        setErrorMessage(`${t("settingsHouseholdRenameFailed")} (${raw})`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          {t("householdName")}
        </span>
        <input
          type="text"
          required
          maxLength={100}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={inputClass}
        />
      </label>

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
        disabled={submitting || unchanged}
        className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400 sm:w-auto sm:self-start"
      >
        {submitting
          ? t("settingsRenamingHousehold")
          : t("settingsRenameHousehold")}
      </button>
    </form>
  );
}

function DeleteHouseholdForm({
  deleteActiveHousehold,
}: {
  deleteActiveHousehold: () => Promise<number>;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [confirmValue, setConfirmValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canDelete = confirmValue.trim().toUpperCase() === "DELETE";

  const handleDelete = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!canDelete) return;

    setSubmitting(true);
    try {
      const remaining = await deleteActiveHousehold();
      setConfirmValue("");
      setSuccessMessage(t("householdDeletedSuccessfully"));
      if (remaining === 0) {
        router.push("/onboarding");
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : t("settingsDeleteHouseholdFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleDelete}
      className="rounded-lg border border-red-300/60 bg-red-50/70 p-3 dark:border-red-900/60 dark:bg-red-950/20"
    >
      <p className="text-sm font-semibold text-red-800 dark:text-red-200">
        {t("deleteHousehold")}
      </p>
      <p className="mt-1 text-xs text-red-700 dark:text-red-300">
        {t("settingsDeleteHouseholdWarning")}
      </p>
      <p className="mt-2 text-xs font-medium text-red-700 dark:text-red-300">
        {t("settingsDeleteHouseholdConfirm")}
      </p>
      <label className="mt-2 block">
        <span className="mb-1 block text-xs font-medium text-red-700 dark:text-red-300">
          {t("settingsDeleteHouseholdConfirmLabel")}
        </span>
        <input
          type="text"
          value={confirmValue}
          onChange={(event) => setConfirmValue(event.target.value)}
          placeholder={t("settingsDeleteHouseholdConfirmPlaceholder")}
          className={inputClass}
        />
      </label>

      {errorMessage && (
        <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}
      {successMessage && (
        <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          {successMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !canDelete}
        className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {submitting
          ? t("settingsDeletingHousehold")
          : t("settingsDeleteHousehold")}
      </button>
    </form>
  );
}
