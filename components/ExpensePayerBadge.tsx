import type { Expense } from "@/types";

type ExpensePayerBadgeProps = {
  expense: Expense;
  /** Fallback when joined `members.full_name` is missing (e.g. household roster). */
  fallbackName?: string;
  paidByLabel: string;
  unknownMemberLabel: string;
};

function resolvePayerName(
  expense: Expense,
  fallbackName: string | undefined,
  unknownMemberLabel: string,
): string {
  const joined = expense.members?.full_name?.trim();
  if (joined) return joined;
  const fallback = fallbackName?.trim();
  if (fallback) return fallback;
  return unknownMemberLabel;
}

export default function ExpensePayerBadge({
  expense,
  fallbackName,
  paidByLabel,
  unknownMemberLabel,
}: ExpensePayerBadgeProps) {
  const payerName = resolvePayerName(expense, fallbackName, unknownMemberLabel);
  const avatarUrl = expense.members?.avatar_url?.trim() || null;
  const initial = payerName.charAt(0).toUpperCase() || "?";

  return (
    <div className="mt-1 flex items-center gap-2">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          className="h-5 w-5 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold uppercase text-slate-600 dark:bg-gray-800 dark:text-slate-300"
          aria-hidden
        >
          {initial}
        </span>
      )}
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-gray-800 dark:text-slate-300">
        {paidByLabel.replace("{name}", payerName)}
      </span>
    </div>
  );
}
