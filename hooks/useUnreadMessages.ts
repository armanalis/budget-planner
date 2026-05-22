"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useExpenses } from "@/context/ExpenseContext";
import { createClient } from "@/utils/supabase/client";

const STORAGE_PREFIX = "budget-planner-messages-last-read:";
const POLL_MS = 30_000;

export function getMessagesLastReadKey(householdId: string) {
  return `${STORAGE_PREFIX}${householdId}`;
}

export function markMessagesRead(householdId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getMessagesLastReadKey(householdId), new Date().toISOString());
}

/** Polls unread message count (no Realtime — avoids duplicate-channel crashes). */
export function useUnreadMessages() {
  const { currentUser, household, activeHouseholdId } = useExpenses();
  const pathname = usePathname();
  const householdId = household?.id ?? activeHouseholdId ?? null;
  const [unreadCount, setUnreadCount] = useState(0);
  const [supabase] = useState(() => createClient());

  const refreshUnread = useCallback(async () => {
    if (!householdId || !currentUser?.id) {
      setUnreadCount(0);
      return;
    }

    const lastRead =
      typeof window !== "undefined"
        ? localStorage.getItem(getMessagesLastReadKey(householdId))
        : null;

    let query = supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("household_id", householdId)
      .neq("sender_id", currentUser.id);

    if (lastRead) {
      query = query.gt("created_at", lastRead);
    }

    const { count, error } = await query;
    if (!error) {
      setUnreadCount(count ?? 0);
    }
  }, [householdId, currentUser?.id, supabase]);

  useEffect(() => {
    if (!householdId) {
      setUnreadCount(0);
      return;
    }

    if (pathname.startsWith("/messages")) {
      markMessagesRead(householdId);
      setUnreadCount(0);
      return;
    }

    void refreshUnread();

    const interval = window.setInterval(() => {
      void refreshUnread();
    }, POLL_MS);

    const onFocus = () => {
      void refreshUnread();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [pathname, householdId, refreshUnread]);

  return unreadCount;
}
