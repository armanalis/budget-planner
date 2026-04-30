"use client";

import { useMemo } from "react";
import { useExpenses } from "@/context/ExpenseContext";

export type MemberBalance = {
  memberId: string;
  memberName: string;
  paid: number;
  balance: number;
};

export type Settlements = {
  totalJointSpent: number;
  fairShare: number;
  balances: MemberBalance[];
};

export function useSettlements(): Settlements {
  const { expenses, members, selectedMonth } = useExpenses();

  return useMemo<Settlements>(() => {
    const jointForMonth = expenses.filter(
      (expense) =>
        expense.is_joint && expense.date.startsWith(selectedMonth),
    );

    const totalJointSpent = jointForMonth.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );

    const fairShare =
      members.length > 0 ? totalJointSpent / members.length : 0;

    const paidByMember = jointForMonth.reduce<Record<string, number>>(
      (acc, expense) => {
        acc[expense.user_id] = (acc[expense.user_id] ?? 0) + expense.amount;
        return acc;
      },
      {},
    );

    const balances: MemberBalance[] = members.map((member) => {
      const paid = paidByMember[member.id] ?? 0;
      return {
        memberId: member.id,
        memberName: member.display_name,
        paid,
        balance: paid - fairShare,
      };
    });

    return { totalJointSpent, fairShare, balances };
  }, [expenses, members, selectedMonth]);
}
