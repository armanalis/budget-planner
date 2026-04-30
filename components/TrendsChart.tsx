"use client";

import { useTheme } from "next-themes";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLanguage } from "@/context/LanguageContext";
import type { TrendPoint } from "@/hooks/useTrends";

const BAR_COLOR = "#3B82F6";

export default function TrendsChart({ data }: { data: TrendPoint[] }) {
  const { t } = useLanguage();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (data.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {t("trendsEmpty")}
      </p>
    );
  }

  const tickColor = isDark ? "#94a3b8" : "#475569";
  const gridColor = isDark ? "#1f2937" : "#e2e8f0";
  const tooltipBg = isDark ? "#0f172a" : "#ffffff";
  const tooltipBorder = isDark ? "#334155" : "#e2e8f0";
  const tooltipText = isDark ? "#f1f5f9" : "#0f172a";
  const cursorFill = isDark ? "rgba(148,163,184,0.1)" : "rgba(15,23,42,0.05)";

  return (
    <div className="w-full min-w-0" style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height={320} minWidth={0} minHeight={240}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        >
          <CartesianGrid
            stroke={gridColor}
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            stroke={tickColor}
            tick={{ fill: tickColor, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: gridColor }}
          />
          <YAxis
            stroke={tickColor}
            tick={{ fill: tickColor, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: gridColor }}
            tickFormatter={(value) => `€${value}`}
          />
          <Tooltip
            cursor={{ fill: cursorFill }}
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: 8,
              color: tooltipText,
              fontSize: 12,
            }}
            labelStyle={{ color: tooltipText, fontWeight: 600 }}
            formatter={(value) => {
              const num =
                typeof value === "number" ? value : Number(value ?? 0);
              return [`€${num.toFixed(2)}`, t("trendsTotalLabel")] as [
                string,
                string,
              ];
            }}
          />
          <Bar dataKey="total" fill={BAR_COLOR} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
