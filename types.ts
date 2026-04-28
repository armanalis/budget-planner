export interface Member {
  id: string;
  household_id: string;
  display_name: string;
  created_at: string;
}

export interface Expense {
  id: string;
  household_id: string;
  user_id: string;
  amount: number;
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
