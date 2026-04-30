"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { useExpenses } from "@/context/ExpenseContext";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/utils/supabase/client";
import type { Message } from "@/types";

const MESSAGE_LIMIT = 200;

function normalizeMessage(row: Record<string, unknown>): Message {
  return {
    id: String(row.id),
    household_id: String(row.household_id),
    sender_id: String(row.sender_id),
    content: String(row.content ?? ""),
    created_at: String(row.created_at ?? ""),
  };
}

function formatTimestamp(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

export default function MessagesPage() {
  const { currentUser, household, members, activeHouseholdId } = useExpenses();
  const { t } = useLanguage();

  const [supabase] = useState(() => createClient());
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const householdId = household?.id ?? activeHouseholdId ?? null;
  const senderId = currentUser?.id ?? null;

  const memberMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members) {
      map.set(m.id, m.display_name);
    }
    return map;
  }, [members]);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!householdId) {
        if (cancelled) return;
        setMessages([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("messages")
        .select("id, household_id, sender_id, content, created_at")
        .eq("household_id", householdId)
        .order("created_at", { ascending: true })
        .limit(MESSAGE_LIMIT);
      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        setMessages([]);
      } else {
        setMessages(
          (data ?? []).map((row) =>
            normalizeMessage(row as Record<string, unknown>),
          ),
        );
        setError(null);
      }
      setLoading(false);
      requestAnimationFrame(scrollToBottom);
    })();

    return () => {
      cancelled = true;
    };
  }, [householdId, supabase, scrollToBottom]);

  useEffect(() => {
    if (!householdId) return;

    const channel = supabase
      .channel(`messages:${householdId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          const incoming = normalizeMessage(
            payload.new as Record<string, unknown>,
          );
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
          requestAnimationFrame(scrollToBottom);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          const removedId = String(
            (payload.old as Record<string, unknown>).id ?? "",
          );
          if (!removedId) return;
          setMessages((prev) => prev.filter((m) => m.id !== removedId));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, supabase, scrollToBottom]);

  const handleSend = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const content = draft.trim();
      if (!content || !householdId || !senderId || sending) return;

      setSending(true);
      setError(null);
      try {
        const { error: insertError } = await supabase.from("messages").insert({
          household_id: householdId,
          sender_id: senderId,
          content,
        });
        if (insertError) {
          setError(insertError.message);
          return;
        }
        setDraft("");
      } finally {
        setSending(false);
      }
    },
    [draft, householdId, senderId, sending, supabase],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase
        .from("messages")
        .delete()
        .eq("id", id);
      if (deleteError) {
        setError(deleteError.message);
      }
    },
    [supabase],
  );

  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex h-[calc(100dvh-12rem)] min-h-[24rem] flex-col gap-3 md:h-[calc(100dvh-10rem)]">
      <div
        ref={scrollerRef}
        className="flex-1 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900"
      >
        {loading ? (
          <p className="px-2 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
            {t("loading")}
          </p>
        ) : messages.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
            {t("messagesEmpty")}
          </p>
        ) : (
          messages.map((message) => {
            const isMine = message.sender_id === senderId;
            const senderName =
              memberMap.get(message.sender_id) ?? t("unknownMember");
            return (
              <div
                key={message.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`group max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    isMine
                      ? "bg-blue-600 text-white dark:bg-blue-500"
                      : "bg-slate-100 text-slate-900 dark:bg-gray-800 dark:text-slate-100"
                  }`}
                >
                  {!isMine && (
                    <p className="mb-0.5 text-[11px] font-semibold opacity-80">
                      {senderName}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  <div
                    className={`mt-1 flex items-center justify-end gap-2 text-[10px] ${
                      isMine ? "text-blue-100" : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <span>{formatTimestamp(message.created_at)}</span>
                    {isMine && (
                      <button
                        type="button"
                        onClick={() => void handleDelete(message.id)}
                        className="rounded p-0.5 opacity-0 transition group-hover:opacity-100 hover:bg-blue-700/40"
                        aria-label={t("deleteMessage")}
                      >
                        <Trash2 className="h-3 w-3" aria-hidden />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <form onSubmit={handleSend} className="flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (draft.trim().length > 0) {
                event.currentTarget.form?.requestSubmit();
              }
            }
          }}
          placeholder={t("messageInputPlaceholder")}
          rows={2}
          maxLength={2000}
          className="min-h-[44px] flex-1 resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-slate-100"
        />
        <button
          type="submit"
          disabled={sending || draft.trim().length === 0}
          className="inline-flex h-11 shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">
            {sending ? t("sendingMessage") : t("sendMessage")}
          </span>
        </button>
      </form>
    </div>
  );
}
