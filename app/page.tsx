"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import BalancesCard from "@/components/BalancesCard";
import BudgetProgress from "@/components/BudgetProgress";
import TrendsChart from "@/components/TrendsChart";
import { useExpenses } from "@/context/ExpenseContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTrends } from "@/hooks/useTrends";

const CHART_COLORS = [
  "#3B82F6",
  "#14B8A6",
  "#F97316",
  "#A855F7",
  "#EAB308",
  "#10B981",
  "#EF4444",
  "#6366F1",
];

const MEMBER_CARD_COLORS = [
  "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40",
  "border-teal-200 bg-teal-50 dark:border-teal-800 dark:bg-teal-950/40",
  "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/40",
  "border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/40",
];

const MEMBER_TEXT_COLORS = [
  "text-blue-700 dark:text-blue-400",
  "text-teal-700 dark:text-teal-400",
  "text-orange-700 dark:text-orange-400",
  "text-violet-700 dark:text-violet-400",
];

const MEMBER_AMOUNT_COLORS = [
  "text-blue-900 dark:text-blue-200",
  "text-teal-900 dark:text-teal-200",
  "text-orange-900 dark:text-orange-200",
  "text-violet-900 dark:text-violet-200",
];

type CategorySlice = {
  name: string;
  value: number;
};

type MemberSpendingRow = {
  id: string;
  name: string;
  total: number;
  isCurrent: boolean;
};

function buildCategoryData(
  expenses: { category: string; amount: number }[],
): CategorySlice[] {
  const totalsByCategory = expenses.reduce<Record<string, number>>(
    (acc, expense) => {
      acc[expense.category] = (acc[expense.category] ?? 0) + expense.amount;
      return acc;
    },
    {},
  );

  return Object.entries(totalsByCategory).map(([name, value]) => ({
    name,
    value,
  }));
}

function ExpensePieChart({
  title,
  data,
}: {
  title: string;
  data: CategorySlice[];
}) {
  const { t } = useLanguage();

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
        {title}
      </h2>
      {data.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          {t("noDataYet")}
        </p>
      ) : (
        <>
          <div className="mt-3 w-full min-w-0 shrink-0" style={{ height: 224 }}>
            <ResponsiveContainer width="100%" height={224} minWidth={0} minHeight={200}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `€${Number(value ?? 0).toFixed(2)}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-1">
            {data.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />
                  <span>{item.name}</span>
                </div>
                <span>€{item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default function Home() {
  const { expenses, members, currentUser, selectedMonth, budgets } =
    useExpenses();
  const { t } = useLanguage();
  const trendData = useTrends();
  const displayName = currentUser?.display_name ?? "—";

  const monthExpenses = useMemo(
    () => expenses.filter((expense) => expense.date.startsWith(selectedMonth)),
    [expenses, selectedMonth],
  );
  const userExpenses = useMemo(
    () =>
      monthExpenses.filter(
        (expense) =>
          currentUser !== null &&
          expense.user_id === currentUser.id &&
          !expense.is_joint,
      ),
    [monthExpenses, currentUser],
  );
  const jointExpenses = useMemo(
    () => monthExpenses.filter((expense) => expense.is_joint),
    [monthExpenses],
  );
  const memberSpending = useMemo((): MemberSpendingRow[] => {
    const personalByUser = new Map<string, number>();
    for (const expense of monthExpenses) {
      if (expense.is_joint) continue;
      personalByUser.set(
        expense.user_id,
        (personalByUser.get(expense.user_id) ?? 0) + expense.amount,
      );
    }

    const rows = members.map((member) => ({
      id: member.id,
      name: member.display_name,
      total: personalByUser.get(member.id) ?? 0,
      isCurrent: member.id === currentUser?.id,
    }));

    return rows.sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return b.total - a.total;
    });
  }, [monthExpenses, members, currentUser?.id]);
  const userChartData = useMemo(
    () => buildCategoryData(userExpenses),
    [userExpenses],
  );
  const jointChartData = useMemo(
    () => buildCategoryData(jointExpenses),
    [jointExpenses],
  );
  const userTotal = useMemo(
    () => userExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [userExpenses],
  );
  const jointTotal = useMemo(
    () => jointExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [jointExpenses],
  );
  const totalSpent = useMemo(
    () => userTotal + jointTotal / 2,
    [userTotal, jointTotal],
  );

  const spentByCategory = useMemo(() => {
    return monthExpenses.reduce<Record<string, number>>((acc, expense) => {
      acc[expense.main_category] = (acc[expense.main_category] ?? 0) + expense.amount;
      return acc;
    }, {});
  }, [monthExpenses]);

  const activeBudgets = useMemo(
    () =>
      [...budgets].sort((a, b) => a.category.localeCompare(b.category)),
    [budgets],
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-6">
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/40">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {t("totalSpent")}
          </p>
          <p className="mt-1 text-3xl font-bold text-emerald-900 dark:text-emerald-200">
            €{totalSpent.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-300/80">
            {t("userTotal", { name: displayName })} €{userTotal.toFixed(2)} ·{" "}
            {t("jointTotal")} €{jointTotal.toFixed(2)}
          </p>
        </section>
        <section className="rounded-xl border border-violet-200 bg-violet-50 p-4 shadow-sm dark:border-violet-800 dark:bg-violet-950/40">
          <p className="text-xs font-medium text-violet-700 dark:text-violet-400">
            {t("jointTotal")}
          </p>
          <p className="mt-1 text-3xl font-bold text-violet-900 dark:text-violet-200">
            €{jointTotal.toFixed(2)}
          </p>
        </section>
      </div>

      {memberSpending.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
            {t("householdSpendingTitle")}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {memberSpending.map((row, index) => {
              const colorIndex = index % MEMBER_CARD_COLORS.length;
              const label = row.isCurrent
                ? t("youSpent")
                : t("memberSpent", { name: row.name });
              return (
                <article
                  key={row.id}
                  className={`rounded-xl border p-4 shadow-sm ${MEMBER_CARD_COLORS[colorIndex]} ${row.isCurrent ? "ring-2 ring-blue-400/60 dark:ring-blue-500/50" : ""}`}
                >
                  <p
                    className={`text-xs font-medium ${MEMBER_TEXT_COLORS[colorIndex]}`}
                  >
                    {label}
                  </p>
                  <p
                    className={`mt-1 text-2xl font-bold ${MEMBER_AMOUNT_COLORS[colorIndex]}`}
                  >
                    €{row.total.toFixed(2)}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <BalancesCard />

      {activeBudgets.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
            {t("budgetsTitle")}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t("budgetsDashboardSubtitle")}
          </p>
          <div className="mt-4 space-y-4">
            {activeBudgets.map((budget) => (
              <BudgetProgress
                key={budget.id}
                category={budget.category}
                limit={budget.limit_amount}
                spent={spentByCategory[budget.category] ?? 0}
              />
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <ExpensePieChart
          title={t("userExpenses", { name: displayName })}
          data={userChartData}
        />
        <ExpensePieChart title={t("jointExpenses")} data={jointChartData} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
          {t("trendsTitle")}
        </h2>
        <div className="mt-3">
          <TrendsChart data={trendData} />
        </div>
      </section>
    </div>
  );
}
