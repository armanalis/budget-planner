"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Expense, User } from "@/types";

type ExpenseContextValue = {
  expenses: Expense[];
  currentUser: User | null;
  selectedMonth: string;
  addExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  setCurrentUser: (user: User | null) => void;
  setSelectedMonth: (month: string) => void;
};

const STORAGE_KEY = "budget-planner-expenses";
const USER_STORAGE_KEY = "budget-planner-current-user";
const MONTH_STORAGE_KEY = "budget-planner-selected-month";

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

const ExpenseContext = createContext<ExpenseContextValue | undefined>(undefined);

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const savedExpenses = localStorage.getItem(STORAGE_KEY);

    if (!savedExpenses) {
      return [];
    }

    try {
      return JSON.parse(savedExpenses) as Expense[];
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const savedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (savedUser === "Ali" || savedUser === "Zeynep") {
      return savedUser;
    }

    return null;
  });
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (typeof window === "undefined") {
      return getCurrentMonth();
    }

    const savedMonth = localStorage.getItem(MONTH_STORAGE_KEY);
    return savedMonth || getCurrentMonth();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(USER_STORAGE_KEY, currentUser);
      return;
    }

    localStorage.removeItem(USER_STORAGE_KEY);
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(MONTH_STORAGE_KEY, selectedMonth);
  }, [selectedMonth]);

  const value = useMemo<ExpenseContextValue>(
    () => ({
      expenses,
      currentUser,
      selectedMonth,
      addExpense: (expense: Expense) => {
        setExpenses((prevExpenses) => [...prevExpenses, expense]);
      },
      deleteExpense: (id: string) => {
        setExpenses((prevExpenses) =>
          prevExpenses.filter((expense) => expense.id !== id),
        );
      },
      setCurrentUser,
      setSelectedMonth,
    }),
    [expenses, currentUser, selectedMonth],
  );

  return (
    <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpenseContext);

  if (!context) {
    throw new Error("useExpenses must be used within an ExpenseProvider");
  }

  return context;
}
