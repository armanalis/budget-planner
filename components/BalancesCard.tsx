"use client";

import { Scale } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useSettlements } from "@/hooks/useSettlements";

const SETTLED_THRESHOLD = 0.005;

function formatEuro(amount: number): string {
  return `€${amount.toFixed(2)}`;
}

export default function BalancesCard() {
  const { t } = useLanguage();
  const { totalJointSpent, fairShare, balances } = useSettlements();

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-slate-500" aria-hidden />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {t("balancesTitle")}
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t("balancesFairShare")}: {formatEuro(fairShare)}
        </p>
      </header>

      {balances.length === 0 || totalJointSpent === 0 ? (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          {t("balancesEmpty")}
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100 dark:divide-gray-800">
          {balances.map((row) => {
            const isSettled = Math.abs(row.balance) < SETTLED_THRESHOLD;
            const owes = !isSettled && row.balance < 0;

            const statusLabel = isSettled
              ? t("balanceSettledUp")
              : owes
                ? t("balanceOwes")
                : t("balanceIsOwed");

            const statusClass = isSettled
              ? "text-slate-500 dark:text-slate-400"
              : owes
                ? "text-red-600 dark:text-red-400"
                : "text-emerald-600 dark:text-emerald-400";

            return (
              <li
                key={row.memberId}
                className="flex items-center justify-between gap-3 py-2 first:pt-3 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {row.memberName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("balancesPaidLabel")}: {formatEuro(row.paid)}
                  </p>
                </div>
                <div className={`text-right text-sm font-semibold ${statusClass}`}>
                  <p>{statusLabel}</p>
                  {!isSettled && (
                    <p className="text-xs font-medium tabular-nums">
                      {formatEuro(Math.abs(row.balance))}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
