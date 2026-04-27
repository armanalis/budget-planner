"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Expense, Member, NewExpenseInput } from "@/types";
import { createClient } from "@/utils/supabase/client";

type ExpenseContextValue = {
  expenses: Expense[];
  members: Member[];
  currentUser: Member | null;
  selectedMonth: string;
  loading: boolean;
  error: string | null;
  addExpense: (input: NewExpenseInput) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setSelectedMonth: (month: string) => void;
  signOut: () => Promise<void>;
};

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Supabase NUMERIC columns may arrive as strings. Coerce defensively so
 * `expense.amount.toFixed(...)` etc. keep working everywhere downstream.
 */
function normalizeExpense(row: Record<string, unknown>): Expense {
  return {
    id: String(row.id),
    household_id: String(row.household_id),
    user_id: String(row.user_id),
    amount: typeof row.amount === "string" ? Number(row.amount) : Number(row.amount ?? 0),
    category: String(row.category ?? ""),
    date: String(row.date ?? ""),
    note: String(row.note ?? ""),
    is_joint: Boolean(row.is_joint),
  };
}

const ExpenseContext = createContext<ExpenseContextValue | undefined>(undefined);

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  if (supabaseRef.current === null) {
    supabaseRef.current = createClient();
  }
  const supabase = supabaseRef.current;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadHouseholdData = useCallback(
    async (authUserId: string) => {
      setError(null);

      const { data: meRow, error: meError } = await supabase
        .from("users")
        .select("id, household_id, display_name, created_at")
        .eq("id", authUserId)
        .maybeSingle();

      if (meError) {
        setError(meError.message);
        setCurrentUser(null);
        setMembers([]);
        setExpenses([]);
        return;
      }

      if (!meRow) {
        setError("No household profile found for this account.");
        setCurrentUser(null);
        setMembers([]);
        setExpenses([]);
        return;
      }

      const me = meRow as Member;
      setCurrentUser(me);

      const [{ data: memberRows, error: membersError }, { data: expenseRows, error: expensesError }] =
        await Promise.all([
          supabase
            .from("users")
            .select("id, household_id, display_name, created_at")
            .eq("household_id", me.household_id)
            .order("created_at", { ascending: true }),
          supabase
            .from("expenses")
            .select("id, household_id, user_id, amount, category, date, note, is_joint")
            .eq("household_id", me.household_id)
            .order("date", { ascending: false }),
        ]);

      if (membersError) {
        setError(membersError.message);
        setMembers([]);
      } else {
        setMembers((memberRows ?? []) as Member[]);
      }

      if (expensesError) {
        setError((prev) => prev ?? expensesError.message);
        setExpenses([]);
      } else {
        setExpenses((expenseRows ?? []).map((row) => normalizeExpense(row as Record<string, unknown>)));
      }
    },
    [supabase],
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (cancelled) return;

      if (sessionError) {
        setError(sessionError.message);
      }

      const userId = data.session?.user.id;
      if (!userId) {
        setCurrentUser(null);
        setMembers([]);
        setExpenses([]);
        setLoading(false);
        return;
      }

      await loadHouseholdData(userId);
      if (!cancelled) setLoading(false);
    }

    bootstrap();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user.id;
      if (!userId) {
        setCurrentUser(null);
        setMembers([]);
        setExpenses([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      loadHouseholdData(userId).finally(() => {
        if (!cancelled) setLoading(false);
      });
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supabase, loadHouseholdData]);

  const addExpense = useCallback(
    async (input: NewExpenseInput) => {
      if (!currentUser) {
        throw new Error("Cannot add expense: no signed-in member.");
      }

      const { data, error: insertError } = await supabase
        .from("expenses")
        .insert({
          household_id: currentUser.household_id,
          user_id: input.user_id,
          amount: input.amount,
          category: input.category,
          date: input.date,
          note: input.note,
          is_joint: input.is_joint,
        })
        .select("id, household_id, user_id, amount, category, date, note, is_joint")
        .single();

      if (insertError || !data) {
        throw new Error(insertError?.message ?? "Failed to add expense.");
      }

      const inserted = normalizeExpense(data as Record<string, unknown>);
      setExpenses((prev) => [inserted, ...prev]);
    },
    [supabase, currentUser],
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase.from("expenses").delete().eq("id", id);
      if (deleteError) {
        throw new Error(deleteError.message);
      }
      setExpenses((prev) => prev.filter((expense) => expense.id !== id));
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const value = useMemo<ExpenseContextValue>(
    () => ({
      expenses,
      members,
      currentUser,
      selectedMonth,
      loading,
      error,
      addExpense,
      deleteExpense,
      setSelectedMonth,
      signOut,
    }),
    [expenses, members, currentUser, selectedMonth, loading, error, addExpense, deleteExpense, signOut],
  );

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpenses() {
  const context = useContext(ExpenseContext);

  if (!context) {
    throw new Error("useExpenses must be used within an ExpenseProvider");
  }

  return context;
}
