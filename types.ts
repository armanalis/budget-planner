export type Ledger = "Ali" | "Zeynep" | "Joint Account";
export type User = "Ali" | "Zeynep";

export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  note: string;
  ledger: Ledger;
}
