/** Alias for `public.users` rows in app code. */
export type User = Member;

export type HouseholdRole = "owner" | "member";

/** Membership row with role. */
export interface HouseholdMember {
  user_id: string;
  household_id: string;
  role: HouseholdRole;
}

export interface Member {
  id: string;
  /** Active household selection for this user. */
  active_household_id: string | null;
  display_name: string;
  created_at: string;
}

/** Household record used across switcher, settings, and dashboard. */
export interface Household {
  id: string;
  name: string;
  household_type: "romantic_relationship" | "housemates" | "family" | "other";
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

/** Insert payload for new expenses (`household_id` is set in context). */
export type NewExpenseInput = Omit<Expense, "id" | "household_id">;

export type NotificationType =
  | "join_request_received"
  | "join_request_approved"
  | "join_request_rejected"
  | "budget_over_limit"
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
  /** First month this template should run ("YYYY-MM"). */
  next_process_month: string;
}
