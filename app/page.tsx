"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useExpenses } from "@/context/ExpenseContext";

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
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      {data.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No data yet.</p>
      ) : (
        <>
          <div className="mt-3 h-56 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
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
                <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-1">
            {data.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs text-slate-600"
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
  const monthExpenses = useMemo(
    () => expenses.filter((expense) => expense.date.startsWith(selectedMonth)),
    [expenses, selectedMonth],
  );
  const userExpenses = useMemo(
    () =>
      monthExpenses.filter(
        (expense) => currentUser !== null && expense.ledger === currentUser,
      ),
    [monthExpenses, currentUser],
  );
  const jointExpenses = useMemo(
    () => monthExpenses.filter((expense) => expense.ledger === "Joint Account"),
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
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <p className="text-sm font-semibold text-emerald-700">Total Spent</p>
        <p className="mt-1 text-3xl font-bold text-emerald-900">
          €{totalSpent.toFixed(2)}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-blue-700">
            {currentUser ?? "User"}&apos;s Total
          </p>
          <p className="mt-1 text-xl font-semibold text-blue-900">
            €{userTotal.toFixed(2)}
          </p>
        </section>
        <section className="rounded-xl border border-violet-200 bg-violet-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-violet-700">Joint Total</p>
          <p className="mt-1 text-xl font-semibold text-violet-900">
            €{jointTotal.toFixed(2)}
          </p>
        </section>
      </div>

      <ExpensePieChart
        title={`${currentUser ?? "User"}'s Expenses`}
        data={userChartData}
      />
      <ExpensePieChart title="Joint Expenses" data={jointChartData} />
    </div>
  );
}
