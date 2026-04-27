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
