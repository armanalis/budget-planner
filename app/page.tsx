"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useExpenses } from "@/context/ExpenseContext";
import { useLanguage } from "@/context/LanguageContext";

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

type CategorySlice = {
  name: string;
  value: number;
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
  const { expenses, currentUser, selectedMonth } = useExpenses();
  const { t } = useLanguage();
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

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/40">
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          {t("totalSpent")}
        </p>
        <p className="mt-1 text-3xl font-bold text-emerald-900 dark:text-emerald-200">
          €{totalSpent.toFixed(2)}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm dark:border-blue-800 dark:bg-blue-950/40">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
            {t("userTotal", { name: displayName })}
          </p>
          <p className="mt-1 text-xl font-semibold text-blue-900 dark:text-blue-200">
            €{userTotal.toFixed(2)}
          </p>
        </section>
        <section className="rounded-xl border border-violet-200 bg-violet-50 p-4 shadow-sm dark:border-violet-800 dark:bg-violet-950/40">
          <p className="text-xs font-medium text-violet-700 dark:text-violet-400">
            {t("jointTotal")}
          </p>
          <p className="mt-1 text-xl font-semibold text-violet-900 dark:text-violet-200">
            €{jointTotal.toFixed(2)}
          </p>
        </section>
      </div>

      <ExpensePieChart
        title={t("userExpenses", { name: displayName })}
        data={userChartData}
      />
      <ExpensePieChart title={t("jointExpenses")} data={jointChartData} />
    </div>
  );
}
