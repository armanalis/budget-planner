export interface Member {
  id: string;
  /**
   * The household this user is currently looking at. Membership in additional
   * households is tracked via the `household_members` table — this column is
   * only the active selection.
   */
  active_household_id: string | null;
  display_name: string;
  created_at: string;
}

/**
 * Lightweight household record used for the household switcher and anywhere
 * we render the active household. The full row also has `created_by`, which
 * is needed to determine whether the current user owns the household.
 */
export interface Household {
  id: string;
  name: string;
  created_by: string | null;
}

export interface Message {
  id: string;
  household_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Expense {
  id: string;
  household_id: string;
  user_id: string;
  amount: number;
  main_category: string;
  sub_category: string | null;
  category: string;
  date: string;
  note: string;
  is_joint: boolean;
}

/** Shape used to insert a new expense. household_id is filled by the context from the current member. */
export type NewExpenseInput = Omit<Expense, "id" | "household_id">;

export type NotificationType =
  | "join_request_received"
  | "join_request_approved"
  | "join_request_rejected"
  | (string & {});

export interface AppNotification {
  id: string;
  recipient_id: string;
  type: NotificationType;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface PendingJoinRequest {
  id: string;
  household_id: string;
  household_name: string;
  status: "pending";
  created_at: string;
}

export interface Budget {
  id: string;
  household_id: string;
  category: string;
  limit_amount: number;
}

export interface SubcategoryBudget {
  id: string;
  household_id: string;
  main_category: string;
  sub_category: string;
  limit_amount: number;
}

export interface RecurringExpense {
  id: string;
  household_id: string;
  user_id: string;
  amount: number;
  main_category: string;
  sub_category: string | null;
  category: string;
  note: string;
  is_joint: boolean;
  /** "YYYY-MM" — first month this template should fire. */
  next_process_month: string;
}
