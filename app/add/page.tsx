"use client";

/** Add expense page with live TRY→EUR conversion fallback. */
import { useEffect, useState } from "react";
import AddExpenseForm from "@/components/add-expense-form";
import UndoLastExpenseCard from "@/components/undo-last-expense-card";

const FALLBACK_EXCHANGE_RATE = 52.72;

export default function AddPage() {
  const [liveExchangeRate, setLiveExchangeRate] = useState<number>(
    FALLBACK_EXCHANGE_RATE,
  );
  const [isFetchingLiveRate, setIsFetchingLiveRate] = useState(true);
  const [isUsingFallbackRate, setIsUsingFallbackRate] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function fetchLiveRate() {
      try {
        setIsFetchingLiveRate(true);
        const response = await fetch(
          "https://api.frankfurter.dev/v2/rate/EUR/TRY",
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch exchange rate");
        }

        const data = (await response.json()) as { rate?: number };

        if (!data.rate || Number.isNaN(data.rate)) {
          throw new Error("Invalid exchange rate payload");
        }

        if (!isCancelled) {
          setLiveExchangeRate(data.rate);
          setIsUsingFallbackRate(false);
        }
      } catch {
        if (!isCancelled) {
          setLiveExchangeRate(FALLBACK_EXCHANGE_RATE);
          setIsUsingFallbackRate(true);
        }
      } finally {
        if (!isCancelled) {
          setIsFetchingLiveRate(false);
        }
      }
    }

    fetchLiveRate();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <AddExpenseForm
        liveExchangeRate={liveExchangeRate}
        isFetchingLiveRate={isFetchingLiveRate}
        isUsingFallbackRate={isUsingFallbackRate}
      />
      <UndoLastExpenseCard />
    </div>
  );
}
