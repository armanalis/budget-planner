"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  AppNotification,
  Expense,
  Household,
  Member,
  NewExpenseInput,
  PendingJoinRequest,
} from "@/types";
import { createClient } from "@/utils/supabase/client";

type ExpenseContextValue = {
  expenses: Expense[];
  members: Member[];
  currentUser: Member | null;
  household: Household | null;
  selectedMonth: string;
  loading: boolean;
  error: string | null;
  pendingRequest: PendingJoinRequest | null;
  isAuthenticated: boolean;
  notifications: AppNotification[];
  unreadNotificationCount: number;
  ownsHousehold: boolean;
  addExpense: (input: NewExpenseInput) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setSelectedMonth: (month: string) => void;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  approveJoinRequest: (requestId: string) => Promise<void>;
  rejectJoinRequest: (requestId: string) => Promise<void>;
};

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function normalizeExpense(row: Record<string, unknown>): Expense {
  return {
    id: String(row.id),
    household_id: String(row.household_id),
    user_id: String(row.user_id),
    amount:
      typeof row.amount === "string"
        ? Number(row.amount)
        : Number(row.amount ?? 0),
    category: String(row.category ?? ""),
    date: String(row.date ?? ""),
    note: String(row.note ?? ""),
    is_joint: Boolean(row.is_joint),
  };
}

function normalizeNotification(row: Record<string, unknown>): AppNotification {
  return {
    id: String(row.id),
    recipient_id: String(row.recipient_id),
    type: String(row.type) as AppNotification["type"],
    data:
      row.data && typeof row.data === "object"
        ? (row.data as Record<string, unknown>)
        : {},
    is_read: Boolean(row.is_read),
    created_at: String(row.created_at),
  };
}

const ExpenseContext = createContext<ExpenseContextValue | undefined>(undefined);

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingRequest, setPendingRequest] = useState<PendingJoinRequest | null>(
    null,
  );
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [ownsHousehold, setOwnsHousehold] = useState<boolean>(false);
  const [household, setHousehold] = useState<Household | null>(null);

  const refreshNotifications = useCallback(async () => {
    if (!authUserId) {
      setNotifications([]);
      return;
    }

    const { data, error: notifError } = await supabase
      .from("notifications")
      .select("id, recipient_id, type, data, is_read, created_at")
      .eq("recipient_id", authUserId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (notifError) {
      return;
    }

    setNotifications(
      (data ?? []).map((row) => normalizeNotification(row as Record<string, unknown>)),
    );
  }, [supabase, authUserId]);

  const loadHouseholdData = useCallback(
    async (signedInUserId: string) => {
      setError(null);

      const { data: meRow, error: meError } = await supabase
        .from("users")
        .select("id, household_id, display_name, created_at")
        .eq("id", signedInUserId)
        .maybeSingle();

      if (meError) {
        setError(meError.message);
        setCurrentUser(null);
        setMembers([]);
        setExpenses([]);
        setOwnsHousehold(false);
        setHousehold(null);
        return;
      }

      if (!meRow) {
        // No profile yet. Check whether the user has a pending join request.
        setCurrentUser(null);
        setMembers([]);
        setExpenses([]);
        setOwnsHousehold(false);
        setHousehold(null);

        const { data: pendingRows, error: pendingError } = await supabase
          .from("household_join_requests")
          .select(
            "id, household_id, status, created_at, household:households(id, name)",
          )
          .eq("requester_id", signedInUserId)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(1);

        if (pendingError) {
          setError(pendingError.message);
          setPendingRequest(null);
          return;
        }

        const row = pendingRows?.[0] as
          | {
              id: string;
              household_id: string;
              status: "pending";
              created_at: string;
              household:
                | { id: string; name: string }
                | { id: string; name: string }[]
                | null;
            }
          | undefined;

        if (row) {
          const householdRow = Array.isArray(row.household)
            ? row.household[0]
            : row.household;
          setPendingRequest({
            id: row.id,
            household_id: row.household_id,
            household_name: householdRow?.name ?? "",
            status: "pending",
            created_at: row.created_at,
          });
        } else {
          setPendingRequest(null);
          setError("No household profile found for this account.");
        }
        return;
      }

      const me = meRow as Member;
      setCurrentUser(me);
      setPendingRequest(null);

      const [
        { data: memberRows, error: membersError },
        { data: expenseRows, error: expensesError },
        { data: householdRow, error: householdError },
      ] = await Promise.all([
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
        supabase
          .from("households")
          .select("id, name, created_by")
          .eq("id", me.household_id)
          .maybeSingle(),
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
        setExpenses(
          (expenseRows ?? []).map((row) =>
            normalizeExpense(row as Record<string, unknown>),
          ),
        );
      }

      if (!householdError && householdRow) {
        const row = householdRow as {
          id: string;
          name: string;
          created_by: string | null;
        };
        setHousehold({
          id: row.id,
          name: row.name,
          created_by: row.created_by,
        });
        setOwnsHousehold(row.created_by === signedInUserId);
      } else {
        setHousehold(null);
        setOwnsHousehold(false);
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

      const userId = data.session?.user.id ?? null;
      setAuthUserId(userId);

      if (!userId) {
        setCurrentUser(null);
        setMembers([]);
        setExpenses([]);
        setPendingRequest(null);
        setNotifications([]);
        setOwnsHousehold(false);
        setHousehold(null);
        setLoading(false);
        return;
      }

      await loadHouseholdData(userId);
      if (!cancelled) setLoading(false);
    }

    bootstrap();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user.id ?? null;
      setAuthUserId(userId);

      if (!userId) {
        setCurrentUser(null);
        setMembers([]);
        setExpenses([]);
        setPendingRequest(null);
        setNotifications([]);
        setOwnsHousehold(false);
        setHousehold(null);
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

  useEffect(() => {
    if (!authUserId) return;
    let cancelled = false;
    (async () => {
      const { data, error: notifError } = await supabase
        .from("notifications")
        .select("id, recipient_id, type, data, is_read, created_at")
        .eq("recipient_id", authUserId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (cancelled || notifError) return;
      setNotifications(
        (data ?? []).map((row) =>
          normalizeNotification(row as Record<string, unknown>),
        ),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [authUserId, supabase]);

  const refresh = useCallback(async () => {
    if (!authUserId) return;
    setLoading(true);
    try {
      await loadHouseholdData(authUserId);
      await refreshNotifications();
    } finally {
      setLoading(false);
    }
  }, [authUserId, loadHouseholdData, refreshNotifications]);

  const markNotificationRead = useCallback(
    async (id: string) => {
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (updateError) {
        throw new Error(updateError.message);
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    },
    [supabase],
  );

  const approveJoinRequest = useCallback(
    async (requestId: string) => {
      const { error: rpcError } = await supabase.rpc("approve_join_request", {
        p_request_id: requestId,
      });
      if (rpcError) throw new Error(rpcError.message);
      await refresh();
    },
    [supabase, refresh],
  );

  const rejectJoinRequest = useCallback(
    async (requestId: string) => {
      const { error: rpcError } = await supabase.rpc("reject_join_request", {
        p_request_id: requestId,
      });
      if (rpcError) throw new Error(rpcError.message);
      await refresh();
    },
    [supabase, refresh],
  );

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
      const { error: deleteError } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id);
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

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications],
  );

  const value = useMemo<ExpenseContextValue>(
    () => ({
      expenses,
      members,
      currentUser,
      household,
      selectedMonth,
      loading,
      error,
      pendingRequest,
      isAuthenticated: authUserId !== null,
      notifications,
      unreadNotificationCount,
      ownsHousehold,
      addExpense,
      deleteExpense,
      setSelectedMonth,
      signOut,
      refresh,
      refreshNotifications,
      markNotificationRead,
      approveJoinRequest,
      rejectJoinRequest,
    }),
    [
      expenses,
      members,
      currentUser,
      household,
      selectedMonth,
      loading,
      error,
      pendingRequest,
      authUserId,
      notifications,
      unreadNotificationCount,
      ownsHousehold,
      addExpense,
      deleteExpense,
      signOut,
      refresh,
      refreshNotifications,
      markNotificationRead,
      approveJoinRequest,
      rejectJoinRequest,
    ],
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
