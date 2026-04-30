"use client";

import { useMemo } from "react";
import { useExpenses } from "@/context/ExpenseContext";

export type TrendPoint = {
  month: string;
  total: number;
};

export function useTrends(): TrendPoint[] {
  const { expenses } = useExpenses();

  return useMemo<TrendPoint[]>(() => {
    const totalsByMonth = expenses.reduce<Record<string, number>>(
      (acc, expense) => {
        const month = expense.date.slice(0, 7);
        if (!month) return acc;
        acc[month] = (acc[month] ?? 0) + expense.amount;
        return acc;
      },
      {},
    );

    return Object.entries(totalsByMonth)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [expenses]);
}
