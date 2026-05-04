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
  Budget,
  Expense,
  Household,
  Member,
  NewExpenseInput,
  PendingJoinRequest,
  RecurringExpense,
  SubcategoryBudget,
} from "@/types";
import { createClient } from "@/utils/supabase/client";

type SessionLikeError = { message?: string | null };

/** True when cookies/storage hold a Supabase session the server no longer accepts. */
function isStaleRefreshSessionError(error: SessionLikeError | null): boolean {
  const message = error?.message?.toLowerCase() ?? "";
  if (!message) return false;
  return (
    message.includes("refresh token") ||
    message.includes("invalid jwt") ||
    /\bjwt\b[^a-z]*expired/.test(message) ||
    message.includes("session expired")
  );
}

async function clearStaleAuthSession(client: ReturnType<typeof createClient>) {
  try {
    await client.auth.signOut({ scope: "local" });
  } catch {
    /* cookies/storage may already be empty */
  }
}

export type NewRecurringExpenseInput = Omit<
  RecurringExpense,
  "id" | "household_id" | "next_process_month"
> & {
  next_process_month?: string;
};

export type ProcessRecurringResult = {
  processedCount: number;
};

type ExpenseContextValue = {
  expenses: Expense[];
  members: Member[];
  currentUser: Member | null;
  household: Household | null;
  /** Every household the current user belongs to. */
  myHouseholds: Household[];
  /** The household the current user is currently looking at. */
  activeHouseholdId: string | null;
  selectedMonth: string;
  loading: boolean;
  error: string | null;
  pendingRequest: PendingJoinRequest | null;
  isAuthenticated: boolean;
  notifications: AppNotification[];
  unreadNotificationCount: number;
  ownsHousehold: boolean;
  budgets: Budget[];
  subcategoryBudgets: SubcategoryBudget[];
  /** False when `expenses` / `recurring_expenses` rows lack main/sub columns (run latest SQL). */
  supportsExpenseHierarchy: boolean;
  /** False when `subcategory_budgets` table is missing. */
  supportsSubcategoryBudgetTable: boolean;
  recurringExpenses: RecurringExpense[];
  addExpense: (input: NewExpenseInput) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setSelectedMonth: (month: string) => void;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  approveJoinRequest: (requestId: string) => Promise<void>;
  rejectJoinRequest: (requestId: string) => Promise<void>;
  renameHousehold: (newName: string) => Promise<void>;
  /** Deletes active household (owners only). Returns remaining membership count for this user. */
  deleteActiveHousehold: () => Promise<number>;
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
  createRecurringExpense: (input: NewRecurringExpenseInput) => Promise<void>;
  deleteRecurringExpense: (id: string) => Promise<void>;
  processRecurringExpenses: () => Promise<ProcessRecurringResult>;
  /** Switch the active household to one the user already belongs to. */
  switchHousehold: (newHouseholdId: string) => Promise<void>;
  /** Role in the active household (`household_members.role`). */
  activeRole: "owner" | "member" | null;
};

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function addOneMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split("-").map(Number);
  if (!y || !m) return yyyymm;
  const next = new Date(Date.UTC(y, m, 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;
}

const EXPENSE_SELECT_HIERARCHY =
  "id, household_id, user_id, amount, main_category, sub_category, category, date, note, is_joint";

const EXPENSE_SELECT_LEGACY =
  "id, household_id, user_id, amount, category, date, note, is_joint";

const RECURRING_SELECT_HIERARCHY =
  "id, household_id, user_id, amount, main_category, sub_category, category, note, is_joint, next_process_month";

const RECURRING_SELECT_LEGACY =
  "id, household_id, user_id, amount, category, note, is_joint, next_process_month";

/** PostgREST / schema-cache messages when columns or tables were not migrated yet. */
function isExpenseHierarchySchemaError(message?: string | null): boolean {
  const m = (message ?? "").toLowerCase();
  return (
    (m.includes("main_category") || m.includes("sub_category")) &&
    m.includes("expenses") &&
    (m.includes("schema cache") || m.includes("could not find"))
  );
}

function isRecurringHierarchySchemaError(message?: string | null): boolean {
  const m = (message ?? "").toLowerCase();
  return (
    (m.includes("main_category") || m.includes("sub_category")) &&
    m.includes("recurring_expenses") &&
    (m.includes("schema cache") || m.includes("could not find"))
  );
}

function isSubcategoryBudgetsSchemaError(message?: string | null): boolean {
  const m = (message ?? "").toLowerCase();
  return (
    m.includes("subcategory_budgets") &&
    (m.includes("schema cache") || m.includes("could not find"))
  );
}

function normalizeExpense(row: Record<string, unknown>): Expense {
  const resolvedMain =
    row.main_category == null || String(row.main_category).trim() === ""
      ? String(row.category ?? "")
      : String(row.main_category);
  const resolvedSub =
    row.sub_category == null || String(row.sub_category).trim() === ""
      ? null
      : String(row.sub_category);
  return {
    id: String(row.id),
    household_id: String(row.household_id),
    user_id: String(row.user_id),
    amount:
      typeof row.amount === "string"
        ? Number(row.amount)
        : Number(row.amount ?? 0),
    main_category: resolvedMain || "Other",
    sub_category: resolvedSub,
    category: String(row.category ?? ""),
    date: String(row.date ?? ""),
    note: String(row.note ?? ""),
    is_joint: Boolean(row.is_joint),
  };
}

function normalizeBudget(row: Record<string, unknown>): Budget {
  return {
    id: String(row.id),
    household_id: String(row.household_id),
    category: String(row.category ?? ""),
    limit_amount:
      typeof row.limit_amount === "string"
        ? Number(row.limit_amount)
        : Number(row.limit_amount ?? 0),
  };
}

function normalizeSubcategoryBudget(
  row: Record<string, unknown>,
): SubcategoryBudget {
  return {
    id: String(row.id),
    household_id: String(row.household_id),
    main_category: String(row.main_category ?? ""),
    sub_category: String(row.sub_category ?? ""),
    limit_amount:
      typeof row.limit_amount === "string"
        ? Number(row.limit_amount)
        : Number(row.limit_amount ?? 0),
  };
}

function normalizeRecurringExpense(
  row: Record<string, unknown>,
): RecurringExpense {
  const resolvedMain =
    row.main_category == null || String(row.main_category).trim() === ""
      ? String(row.category ?? "")
      : String(row.main_category);
  const resolvedSub =
    row.sub_category == null || String(row.sub_category).trim() === ""
      ? null
      : String(row.sub_category);
  return {
    id: String(row.id),
    household_id: String(row.household_id),
    user_id: String(row.user_id),
    amount:
      typeof row.amount === "string"
        ? Number(row.amount)
        : Number(row.amount ?? 0),
    main_category: resolvedMain || "Other",
    sub_category: resolvedSub,
    category: String(row.category ?? ""),
    note: row.note == null ? "" : String(row.note),
    is_joint: Boolean(row.is_joint),
    next_process_month: String(row.next_process_month ?? ""),
  };
}

function normalizeMember(row: Record<string, unknown>): Member {
  return {
    id: String(row.id),
    active_household_id:
      row.active_household_id == null ? null : String(row.active_household_id),
    display_name: String(row.display_name ?? ""),
    created_at: String(row.created_at ?? ""),
  };
}

function normalizeHousehold(row: Record<string, unknown>): Household {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    created_by: row.created_by == null ? null : String(row.created_by),
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
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [subcategoryBudgets, setSubcategoryBudgets] = useState<
    SubcategoryBudget[]
  >([]);
  const [supportsExpenseHierarchy, setSupportsExpenseHierarchy] =
    useState<boolean>(true);
  const [supportsSubcategoryBudgetTable, setSupportsSubcategoryBudgetTable] =
    useState<boolean>(true);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(
    [],
  );
  const [myHouseholds, setMyHouseholds] = useState<Household[]>([]);
  const [activeHouseholdId, setActiveHouseholdId] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<"owner" | "member" | null>(null);

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

  const resetHouseholdState = useCallback(() => {
    setMembers([]);
    setExpenses([]);
    setHousehold(null);
    setBudgets([]);
    setSubcategoryBudgets([]);
    setRecurringExpenses([]);
    setOwnsHousehold(false);
    setActiveRole(null);
  }, []);

  /**
   * Loads everything that's scoped to ONE specific household: members,
   * expenses, the household record itself, budgets, and recurring templates.
   * RLS uses `current_household_id()` (= users.active_household_id), so we
   * always scope by `householdId` explicitly to keep the queries deterministic.
   */
  const loadActiveHouseholdData = useCallback(
    async (householdId: string, signedInUserId: string) => {
      const [
        { data: memberRows, error: membersError },
        { data: householdRpcRows, error: householdRpcError },
        { data: budgetRows, error: budgetsError },
        { data: myMembershipRow, error: myMembershipError },
      ] = await Promise.all([
        supabase
          .from("household_members")
          .select(
            "user:users(id, active_household_id, display_name, created_at)",
          )
          .eq("household_id", householdId),
        supabase.rpc("get_my_household"),
        supabase
          .from("budgets")
          .select("id, household_id, category, limit_amount")
          .eq("household_id", householdId),
        supabase
          .from("household_members")
          .select("role")
          .eq("household_id", householdId)
          .eq("user_id", signedInUserId)
          .maybeSingle(),
      ]);

      if (!myMembershipError && myMembershipRow?.role === "owner") {
        setActiveRole("owner");
        setOwnsHousehold(true);
      } else if (!myMembershipError && myMembershipRow) {
        setActiveRole("member");
        setOwnsHousehold(false);
      } else {
        setActiveRole(null);
        setOwnsHousehold(false);
      }

      let expenseRows: Record<string, unknown>[] | null = null;
      let expensesError: { message: string } | null = null;

      const expenseAttempt = await supabase
        .from("expenses")
        .select(EXPENSE_SELECT_HIERARCHY)
        .eq("household_id", householdId)
        .order("date", { ascending: false });

      if (
        expenseAttempt.error &&
        isExpenseHierarchySchemaError(expenseAttempt.error.message)
      ) {
        setSupportsExpenseHierarchy(false);
        const legacy = await supabase
          .from("expenses")
          .select(EXPENSE_SELECT_LEGACY)
          .eq("household_id", householdId)
          .order("date", { ascending: false });
        expenseRows = legacy.data as Record<string, unknown>[] | null;
        expensesError = legacy.error;
      } else {
        expenseRows = expenseAttempt.data as Record<string, unknown>[] | null;
        expensesError = expenseAttempt.error;
        if (!expenseAttempt.error) {
          setSupportsExpenseHierarchy(true);
        }
      }

      let recurringRows: Record<string, unknown>[] | null = null;
      let recurringError: { message: string } | null = null;

      const recurringAttempt = await supabase
        .from("recurring_expenses")
        .select(RECURRING_SELECT_HIERARCHY)
        .eq("household_id", householdId)
        .order("next_process_month", { ascending: true });

      if (
        recurringAttempt.error &&
        isRecurringHierarchySchemaError(recurringAttempt.error.message)
      ) {
        const legacyRecurring = await supabase
          .from("recurring_expenses")
          .select(RECURRING_SELECT_LEGACY)
          .eq("household_id", householdId)
          .order("next_process_month", { ascending: true });
        recurringRows = legacyRecurring.data as Record<string, unknown>[] | null;
        recurringError = legacyRecurring.error;
      } else {
        recurringRows = recurringAttempt.data as Record<
          string,
          unknown
        >[] | null;
        recurringError = recurringAttempt.error;
      }

      let subcategoryRows: Record<string, unknown>[] | null = null;
      let subcategoryError: { message: string } | null = null;

      const subAttempt = await supabase
        .from("subcategory_budgets")
        .select("id, household_id, main_category, sub_category, limit_amount")
        .eq("household_id", householdId);

      if (
        subAttempt.error &&
        isSubcategoryBudgetsSchemaError(subAttempt.error.message)
      ) {
        setSupportsSubcategoryBudgetTable(false);
        subcategoryRows = [];
        subcategoryError = null;
      } else {
        subcategoryRows = subAttempt.data as Record<string, unknown>[] | null;
        subcategoryError = subAttempt.error;
        if (!subAttempt.error) {
          setSupportsSubcategoryBudgetTable(true);
        }
      }

      const householdRow = Array.isArray(householdRpcRows)
        ? householdRpcRows[0]
        : householdRpcRows;

      if (membersError) {
        setError(membersError.message);
        setMembers([]);
      } else {
        type MemberRowEnvelope = {
          user:
            | Record<string, unknown>
            | Record<string, unknown>[]
            | null;
        };
        const rows = (memberRows ?? []) as MemberRowEnvelope[];
        const flattened = rows
          .map((row) =>
            Array.isArray(row.user) ? row.user[0] ?? null : row.user,
          )
          .filter((u): u is Record<string, unknown> => u != null);
        setMembers(
          flattened
            .map((u) => normalizeMember(u))
            .sort((a, b) => a.created_at.localeCompare(b.created_at)),
        );
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

      if (!householdRpcError && householdRow) {
        const row = normalizeHousehold(householdRow as Record<string, unknown>);
        setHousehold(row);
      } else {
        setHousehold(null);
      }

      if (budgetsError) {
        setError((prev) => prev ?? budgetsError.message);
        setBudgets([]);
      } else {
        setBudgets(
          (budgetRows ?? []).map((row) =>
            normalizeBudget(row as Record<string, unknown>),
          ),
        );
      }

      if (recurringError) {
        setError((prev) => prev ?? recurringError.message);
        setRecurringExpenses([]);
      } else {
        setRecurringExpenses(
          (recurringRows ?? []).map((row) =>
            normalizeRecurringExpense(row as Record<string, unknown>),
          ),
        );
      }

      if (subcategoryError) {
        setError((prev) => prev ?? subcategoryError.message);
        setSubcategoryBudgets([]);
      } else {
        setSubcategoryBudgets(
          (subcategoryRows ?? []).map((row) =>
            normalizeSubcategoryBudget(row as Record<string, unknown>),
          ),
        );
      }
    },
    [supabase],
  );

  /**
   * Loads everything that's scoped to the signed-in USER: their profile, the
   * full list of households they belong to, and any pending join request.
   * Then defers to {@link loadActiveHouseholdData} for the active household.
   */
  const loadHouseholdData = useCallback(
    async (signedInUserId: string) => {
      setError(null);

      const { data: meRow, error: meError } = await supabase
        .from("users")
        .select("id, active_household_id, display_name, created_at")
        .eq("id", signedInUserId)
        .maybeSingle();

      if (meError) {
        setError(meError.message);
        setCurrentUser(null);
        setMyHouseholds([]);
        setActiveHouseholdId(null);
        resetHouseholdState();
        return;
      }

      if (!meRow) {
        setCurrentUser(null);
        setMyHouseholds([]);
        setActiveHouseholdId(null);
        resetHouseholdState();

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

      const me = normalizeMember(meRow as Record<string, unknown>);
      setCurrentUser(me);
      setPendingRequest(null);

      // Fetch every household the user belongs to.
      const { data: householdRows, error: myHouseholdsError } = await supabase
        .from("household_members")
        .select("household:households(id, name, created_by)")
        .eq("user_id", signedInUserId);

      let resolvedHouseholds: Household[] = [];
      if (myHouseholdsError) {
        setError(myHouseholdsError.message);
        setMyHouseholds([]);
      } else {
        type HouseholdEnvelope = {
          household:
            | Record<string, unknown>
            | Record<string, unknown>[]
            | null;
        };
        const rows = (householdRows ?? []) as HouseholdEnvelope[];
        resolvedHouseholds = rows
          .map((row) =>
            Array.isArray(row.household)
              ? row.household[0] ?? null
              : row.household,
          )
          .filter((h): h is Record<string, unknown> => h != null)
          .map((h) => normalizeHousehold(h))
          .sort((a, b) => a.name.localeCompare(b.name));
        setMyHouseholds(resolvedHouseholds);
      }

      // Decide which household is active. Prefer the user's stored choice,
      // but fall back to the first membership and persist that choice.
      let nextActiveId = me.active_household_id;
      if (
        nextActiveId &&
        resolvedHouseholds.length > 0 &&
        !resolvedHouseholds.some((h) => h.id === nextActiveId)
      ) {
        // Their stored "active" no longer matches any membership (e.g. they
        // were removed from a household). Pick the first available one.
        nextActiveId = resolvedHouseholds[0].id;
      }
      if (!nextActiveId && resolvedHouseholds.length > 0) {
        nextActiveId = resolvedHouseholds[0].id;
      }

      if (nextActiveId && nextActiveId !== me.active_household_id) {
        const { error: switchError } = await supabase.rpc(
          "switch_active_household",
          { p_household_id: nextActiveId },
        );
        if (!switchError) {
          setCurrentUser({ ...me, active_household_id: nextActiveId });
        }
      }

      setActiveHouseholdId(nextActiveId);

      if (!nextActiveId) {
        // User has no memberships yet — nothing to load.
        resetHouseholdState();
        return;
      }

      await loadActiveHouseholdData(nextActiveId, signedInUserId);
    },
    [supabase, loadActiveHouseholdData, resetHouseholdState],
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (cancelled) return;

      if (sessionError) {
        if (isStaleRefreshSessionError(sessionError)) {
          await clearStaleAuthSession(supabase);
          if (cancelled) return;
          setError(null);
          setAuthUserId(null);
          setCurrentUser(null);
          setMyHouseholds([]);
          setActiveHouseholdId(null);
          resetHouseholdState();
          setPendingRequest(null);
          setNotifications([]);
          setLoading(false);
          return;
        }
        setError(sessionError.message);
      }

      let userId = data.session?.user.id ?? null;

      if (userId) {
        const { error: userError } = await supabase.auth.getUser();
        if (cancelled) return;
        if (userError && isStaleRefreshSessionError(userError)) {
          await clearStaleAuthSession(supabase);
          if (cancelled) return;
          setError(null);
          userId = null;
        }
      }

      setAuthUserId(userId);

      if (!userId) {
        setCurrentUser(null);
        setMyHouseholds([]);
        setActiveHouseholdId(null);
        resetHouseholdState();
        setPendingRequest(null);
        setNotifications([]);
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
        setMyHouseholds([]);
        setActiveHouseholdId(null);
        resetHouseholdState();
        setPendingRequest(null);
        setNotifications([]);
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
  }, [supabase, loadHouseholdData, resetHouseholdState]);

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

  const switchHousehold = useCallback(
    async (newHouseholdId: string) => {
      if (!authUserId) return;
      if (!myHouseholds.some((h) => h.id === newHouseholdId)) {
        throw new Error("Cannot switch to a household you don't belong to.");
      }
      if (newHouseholdId === activeHouseholdId) return;

      const { error: rpcError } = await supabase.rpc(
        "switch_active_household",
        { p_household_id: newHouseholdId },
      );
      if (rpcError) {
        throw new Error(rpcError.message);
      }

      setActiveHouseholdId(newHouseholdId);
      setCurrentUser((prev) =>
        prev ? { ...prev, active_household_id: newHouseholdId } : prev,
      );

      setLoading(true);
      try {
        await loadActiveHouseholdData(newHouseholdId, authUserId);
      } finally {
        setLoading(false);
      }
    },
    [
      supabase,
      authUserId,
      activeHouseholdId,
      myHouseholds,
      loadActiveHouseholdData,
    ],
  );

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

  const renameHousehold = useCallback(
    async (newName: string) => {
      const { error: rpcError } = await supabase.rpc("rename_household", {
        p_name: newName,
      });
      if (rpcError) throw new Error(rpcError.message);
      await refresh();
    },
    [supabase, refresh],
  );

  const deleteActiveHousehold = useCallback(async () => {
    const { data: remaining, error: rpcError } = await supabase.rpc(
      "delete_active_household",
    );
    if (rpcError) throw new Error(rpcError.message);
    await refresh();
    return typeof remaining === "number"
      ? remaining
      : Number(remaining ?? 0);
  }, [supabase, refresh]);

  const addExpense = useCallback(
    async (input: NewExpenseInput) => {
      if (!currentUser || !activeHouseholdId) {
        throw new Error("Cannot add expense: no active household.");
      }

      const hierarchicalPayload = {
        household_id: activeHouseholdId,
        user_id: input.user_id,
        amount: input.amount,
        main_category: input.main_category,
        sub_category: input.sub_category,
        category: input.category,
        date: input.date,
        note: input.note,
        is_joint: input.is_joint,
      };

      const legacyPayload = {
        household_id: activeHouseholdId,
        user_id: input.user_id,
        amount: input.amount,
        category: input.category,
        date: input.date,
        note: input.note,
        is_joint: input.is_joint,
      };

      async function insertExpenseRows(payload: object, selectList: string) {
        return supabase
          .from("expenses")
          .insert(payload)
          .select(selectList)
          .single();
      }

      let selectColumns = EXPENSE_SELECT_HIERARCHY;
      let payload: object = hierarchicalPayload;

      if (!supportsExpenseHierarchy) {
        selectColumns = EXPENSE_SELECT_LEGACY;
        payload = legacyPayload;
      }

      let { data, error: insertError } = await insertExpenseRows(
        payload,
        selectColumns,
      );

      if (
        insertError &&
        isExpenseHierarchySchemaError(insertError.message) &&
        supportsExpenseHierarchy
      ) {
        setSupportsExpenseHierarchy(false);
        ({ data, error: insertError } = await insertExpenseRows(
          legacyPayload,
          EXPENSE_SELECT_LEGACY,
        ));
      }

      if (insertError || !data) {
        throw new Error(insertError?.message ?? "Failed to add expense.");
      }

      const inserted = normalizeExpense(data as unknown as Record<string, unknown>);
      setExpenses((prev) => [inserted, ...prev]);
    },
    [supabase, currentUser, activeHouseholdId, supportsExpenseHierarchy],
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

  const updateBudget = useCallback(
    async (category: string, limitAmount: number) => {
      if (!activeHouseholdId) {
        throw new Error("Cannot update budget: no active household.");
      }
      if (!Number.isFinite(limitAmount) || limitAmount < 0) {
        throw new Error("Limit must be a non-negative number.");
      }

      const { data, error: upsertError } = await supabase
        .from("budgets")
        .upsert(
          {
            household_id: activeHouseholdId,
            category,
            limit_amount: limitAmount,
          },
          { onConflict: "household_id,category" },
        )
        .select("id, household_id, category, limit_amount")
        .single();

      if (upsertError || !data) {
        throw new Error(upsertError?.message ?? "Failed to update budget.");
      }

      const upserted = normalizeBudget(data as Record<string, unknown>);
      setBudgets((prev) => {
        const without = prev.filter((b) => b.category !== upserted.category);
        return [...without, upserted];
      });
    },
    [supabase, activeHouseholdId],
  );

  const createRecurringExpense = useCallback(
    async (input: NewRecurringExpenseInput) => {
      if (!currentUser || !activeHouseholdId) {
        throw new Error(
          "Cannot create recurring expense: no active household.",
        );
      }

      const nextProcessMonth =
        input.next_process_month ?? addOneMonth(getCurrentMonth());

      const hierarchicalPayload = {
        household_id: activeHouseholdId,
        user_id: input.user_id,
        amount: input.amount,
        main_category: input.main_category,
        sub_category: input.sub_category,
        category: input.category,
        note: input.note,
        is_joint: input.is_joint,
        next_process_month: nextProcessMonth,
      };

      const legacyPayload = {
        household_id: activeHouseholdId,
        user_id: input.user_id,
        amount: input.amount,
        category: input.category,
        note: input.note,
        is_joint: input.is_joint,
        next_process_month: nextProcessMonth,
      };

      async function insertRecurringRows(payload: object, selectList: string) {
        return supabase
          .from("recurring_expenses")
          .insert(payload)
          .select(selectList)
          .single();
      }

      let selectColumns = RECURRING_SELECT_HIERARCHY;
      let payload: object = hierarchicalPayload;

      if (!supportsExpenseHierarchy) {
        selectColumns = RECURRING_SELECT_LEGACY;
        payload = legacyPayload;
      }

      let { data, error: insertError } = await insertRecurringRows(
        payload,
        selectColumns,
      );

      if (
        insertError &&
        isRecurringHierarchySchemaError(insertError.message) &&
        supportsExpenseHierarchy
      ) {
        setSupportsExpenseHierarchy(false);
        ({ data, error: insertError } = await insertRecurringRows(
          legacyPayload,
          RECURRING_SELECT_LEGACY,
        ));
      }

      if (insertError || !data) {
        throw new Error(
          insertError?.message ?? "Failed to create recurring expense.",
        );
      }

      const inserted = normalizeRecurringExpense(
        data as unknown as Record<string, unknown>,
      );
      setRecurringExpenses((prev) =>
        [...prev, inserted].sort((a, b) =>
          a.next_process_month.localeCompare(b.next_process_month),
        ),
      );
    },
    [supabase, currentUser, activeHouseholdId, supportsExpenseHierarchy],
  );

  const deleteRecurringExpense = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase
        .from("recurring_expenses")
        .delete()
        .eq("id", id);
      if (deleteError) {
        throw new Error(deleteError.message);
      }
      setRecurringExpenses((prev) => prev.filter((row) => row.id !== id));
    },
    [supabase],
  );

  const processRecurringExpenses =
    useCallback(async (): Promise<ProcessRecurringResult> => {
      if (!currentUser || !activeHouseholdId) {
        throw new Error(
          "Cannot process recurring expenses: no active household.",
        );
      }

      const currentMonth = getCurrentMonth();
      const today = getTodayDate();

      const due = recurringExpenses.filter(
        (template) => template.next_process_month <= currentMonth,
      );

      if (due.length === 0) {
        return { processedCount: 0 };
      }

      const expenseRows = supportsExpenseHierarchy
        ? due.map((template) => ({
            household_id: activeHouseholdId,
            user_id: template.user_id,
            amount: template.amount,
            main_category: template.main_category,
            sub_category: template.sub_category,
            category: template.category,
            date: today,
            note: template.note,
            is_joint: template.is_joint,
          }))
        : due.map((template) => ({
            household_id: activeHouseholdId,
            user_id: template.user_id,
            amount: template.amount,
            category: template.category,
            date: today,
            note: template.note,
            is_joint: template.is_joint,
          }));

      let { error: insertError } = await supabase
        .from("expenses")
        .insert(expenseRows);

      if (
        insertError &&
        isExpenseHierarchySchemaError(insertError.message) &&
        supportsExpenseHierarchy
      ) {
        setSupportsExpenseHierarchy(false);
        const legacyRows = due.map((template) => ({
          household_id: activeHouseholdId,
          user_id: template.user_id,
          amount: template.amount,
          category: template.category,
          date: today,
          note: template.note,
          is_joint: template.is_joint,
        }));
        ({ error: insertError } = await supabase
          .from("expenses")
          .insert(legacyRows));
      }

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Advance each due template by one month. Sequential is fine here:
      // each row has its own next_process_month and N is small.
      for (const template of due) {
        const advanced = addOneMonth(template.next_process_month);
        const { error: updateError } = await supabase
          .from("recurring_expenses")
          .update({ next_process_month: advanced })
          .eq("id", template.id);
        if (updateError) {
          throw new Error(updateError.message);
        }
      }

      // Re-fetch so the UI (including dashboard expenses) updates instantly.
      await loadActiveHouseholdData(activeHouseholdId, currentUser.id);

      return { processedCount: due.length };
    }, [
      supabase,
      currentUser,
      activeHouseholdId,
      recurringExpenses,
      loadActiveHouseholdData,
      supportsExpenseHierarchy,
    ]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const upsertSubcategoryBudget = useCallback(
    async (mainCategory: string, subCategory: string, limitAmount: number) => {
      if (!supportsSubcategoryBudgetTable) {
        throw new Error(
          "Sub-category budgets require the latest database_schema.sql (table subcategory_budgets).",
        );
      }
      if (!Number.isFinite(limitAmount) || limitAmount < 0) {
        throw new Error("Limit must be a non-negative number.");
      }
      const { data, error: rpcError } = await supabase.rpc(
        "upsert_subcategory_budget",
        {
          p_main_category: mainCategory,
          p_sub_category: subCategory,
          p_limit_amount: limitAmount,
        },
      );
      if (rpcError) {
        throw new Error(rpcError.message);
      }
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return;
      const upserted = normalizeSubcategoryBudget(row as Record<string, unknown>);
      setSubcategoryBudgets((prev) => {
        const without = prev.filter(
          (b) =>
            !(
              b.main_category === upserted.main_category &&
              b.sub_category === upserted.sub_category
            ),
        );
        return [...without, upserted].sort((a, b) =>
          a.main_category === b.main_category
            ? a.sub_category.localeCompare(b.sub_category)
            : a.main_category.localeCompare(b.main_category),
        );
      });
    },
    [supabase, supportsSubcategoryBudgetTable],
  );

  const deleteSubcategoryBudget = useCallback(
    async (mainCategory: string, subCategory: string) => {
      if (!supportsSubcategoryBudgetTable) {
        throw new Error(
          "Sub-category budgets require the latest database_schema.sql (table subcategory_budgets).",
        );
      }
      const { error: rpcError } = await supabase.rpc("delete_subcategory_budget", {
        p_main_category: mainCategory,
        p_sub_category: subCategory,
      });
      if (rpcError) {
        throw new Error(rpcError.message);
      }
      setSubcategoryBudgets((prev) =>
        prev.filter(
          (b) =>
            !(
              b.main_category === mainCategory && b.sub_category === subCategory
            ),
        ),
      );
    },
    [supabase, supportsSubcategoryBudgetTable],
  );

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
      myHouseholds,
      activeHouseholdId,
      activeRole,
      selectedMonth,
      loading,
      error,
      pendingRequest,
      isAuthenticated: authUserId !== null,
      notifications,
      unreadNotificationCount,
      ownsHousehold,
      budgets,
      subcategoryBudgets,
      supportsExpenseHierarchy,
      supportsSubcategoryBudgetTable,
      recurringExpenses,
      addExpense,
      deleteExpense,
      setSelectedMonth,
      signOut,
      refresh,
      refreshNotifications,
      markNotificationRead,
      approveJoinRequest,
      rejectJoinRequest,
      renameHousehold,
      deleteActiveHousehold,
      updateBudget,
      upsertSubcategoryBudget,
      deleteSubcategoryBudget,
      createRecurringExpense,
      deleteRecurringExpense,
      processRecurringExpenses,
      switchHousehold,
    }),
    [
      expenses,
      members,
      currentUser,
      household,
      myHouseholds,
      activeHouseholdId,
      activeRole,
      selectedMonth,
      loading,
      error,
      pendingRequest,
      authUserId,
      notifications,
      unreadNotificationCount,
      ownsHousehold,
      budgets,
      subcategoryBudgets,
      supportsExpenseHierarchy,
      supportsSubcategoryBudgetTable,
      recurringExpenses,
      addExpense,
      deleteExpense,
      signOut,
      refresh,
      refreshNotifications,
      markNotificationRead,
      approveJoinRequest,
      rejectJoinRequest,
      renameHousehold,
      deleteActiveHousehold,
      updateBudget,
      upsertSubcategoryBudget,
      deleteSubcategoryBudget,
      createRecurringExpense,
      deleteRecurringExpense,
      processRecurringExpenses,
      switchHousehold,
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
