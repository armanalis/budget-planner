"use client";

import { AlertTriangle } from "lucide-react";
import {
  translateMainCategory,
  useLanguage,
} from "@/context/LanguageContext";

export default function BudgetProgress({
  category,
  limit,
  spent,
}: {
  category: string;
  limit: number;
  spent: number;
}) {
  const { t } = useLanguage();
  const categoryLabel = translateMainCategory(t, category);

  const ratio = limit > 0 ? spent / limit : spent > 0 ? Infinity : 0;
  const percent = ratio * 100;
  const isOver = percent > 100;
  const isWarning = percent >= 75 && percent <= 100;

  const widthPct = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 100));
  const barColor = isOver
    ? "bg-red-500"
    : isWarning
      ? "bg-yellow-500"
      : "bg-green-500";

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
          {categoryLabel}
          <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">
            – €{spent.toFixed(2)} {t("ofLabel")} €{limit.toFixed(2)}
          </span>
        </p>
        {isOver && (
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            {t("overBudget")}
          </span>
        )}
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-gray-800"
        role="progressbar"
        aria-label={categoryLabel}
        aria-valuenow={Math.round(widthPct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full ${barColor} transition-[width] duration-300`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}
