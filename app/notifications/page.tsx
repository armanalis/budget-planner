"use client";

import { useState } from "react";
import { Check, X, Bell } from "lucide-react";
import { useExpenses } from "@/context/ExpenseContext";
import { useLanguage } from "@/context/LanguageContext";
import type { AppNotification } from "@/types";

const cardClass =
  "rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900";

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export default function NotificationsPage() {
  const {
    notifications,
    markNotificationRead,
    approveJoinRequest,
    rejectJoinRequest,
  } = useExpenses();
  const { t } = useLanguage();
  const [actionErrorById, setActionErrorById] = useState<Record<string, string>>({});
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  if (notifications.length === 0) {
    return (
      <div
        className={`${cardClass} flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400`}
      >
        <Bell className="h-5 w-5" aria-hidden />
        <span>{t("notificationsEmpty")}</span>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onMarkRead={async () => {
            try {
              await markNotificationRead(notification.id);
            } catch (err) {
              setActionErrorById((prev) => ({
                ...prev,
                [notification.id]:
                  err instanceof Error ? err.message : t("notificationActionFailed"),
              }));
            }
          }}
          onApprove={async (requestId) => {
            setPendingActionId(notification.id);
            setActionErrorById((prev) => {
              const next = { ...prev };
              delete next[notification.id];
              return next;
            });
            try {
              await approveJoinRequest(requestId);
              await markNotificationRead(notification.id);
            } catch (err) {
              setActionErrorById((prev) => ({
                ...prev,
                [notification.id]:
                  err instanceof Error ? err.message : t("notificationActionFailed"),
              }));
            } finally {
              setPendingActionId(null);
            }
          }}
          onReject={async (requestId) => {
            setPendingActionId(notification.id);
            setActionErrorById((prev) => {
              const next = { ...prev };
              delete next[notification.id];
              return next;
            });
            try {
              await rejectJoinRequest(requestId);
              await markNotificationRead(notification.id);
            } catch (err) {
              setActionErrorById((prev) => ({
                ...prev,
                [notification.id]:
                  err instanceof Error ? err.message : t("notificationActionFailed"),
              }));
            } finally {
              setPendingActionId(null);
            }
          }}
          actionError={actionErrorById[notification.id]}
          isBusy={pendingActionId === notification.id}
        />
      ))}
    </ul>
  );
}

function NotificationCard({
  notification,
  onMarkRead,
  onApprove,
  onReject,
  actionError,
  isBusy,
}: {
  notification: AppNotification;
  onMarkRead: () => void | Promise<void>;
  onApprove: (requestId: string) => void | Promise<void>;
  onReject: (requestId: string) => void | Promise<void>;
  actionError?: string;
  isBusy: boolean;
}) {
  const { t } = useLanguage();

  const householdName = getString(notification.data.household_name);
  const requesterName = getString(notification.data.requester_display_name);
  const requesterEmail = getString(notification.data.requester_email);
  const mainCategory = getString(notification.data.main_category);
  const subCategory = getString(notification.data.sub_category);
  const categoryLabel = subCategory ? `${mainCategory} / ${subCategory}` : mainCategory;
  const spent = Number(notification.data.spent_sub ?? notification.data.spent_main ?? 0);
  const limit = Number(notification.data.sub_limit ?? notification.data.main_limit ?? 0);
  const requestId = getString(notification.data.request_id) || undefined;

  let body: string;
  switch (notification.type) {
    case "join_request_received":
      body = t("notificationJoinRequestReceived", {
        name: requesterName,
        email: requesterEmail,
        household: householdName,
      });
      break;
    case "join_request_approved":
      body = t("notificationJoinRequestApproved", { household: householdName });
      break;
    case "join_request_rejected":
      body = t("notificationJoinRequestRejected", { household: householdName });
      break;
    case "budget_over_limit":
      body = t("notificationBudgetOverLimit", {
        category: categoryLabel || mainCategory || t("budgetsTitle"),
        spent: spent.toFixed(2),
        limit: limit.toFixed(2),
      });
      break;
    default:
      body = JSON.stringify(notification.data);
      break;
  }

  return (
    <li>
      <article
        className={`${cardClass} ${
          notification.is_read ? "" : "border-blue-300 dark:border-blue-700"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-slate-800 dark:text-slate-100">{body}</p>
          {!notification.is_read && (
            <span className="inline-flex shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {t("unread")}
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {new Date(notification.created_at).toLocaleString()}
        </p>

        {notification.type === "join_request_received" && (
          <JoinRequestActions
            notificationData={notification.data}
            requestIdFromMetadata={requestId}
            isBusy={isBusy}
            onApprove={onApprove}
            onReject={onReject}
          />
        )}

        {actionError && (
          <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
            {actionError}
          </p>
        )}

        {!notification.is_read && (
          <button
            type="button"
            onClick={() => void onMarkRead()}
            className="mt-3 inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-50 dark:border-gray-700 dark:text-slate-300 dark:hover:bg-gray-800"
          >
            {t("notificationMarkRead")}
          </button>
        )}
      </article>
    </li>
  );
}

function JoinRequestActions({
  notificationData,
  requestIdFromMetadata,
  isBusy,
  onApprove,
  onReject,
}: {
  notificationData: Record<string, unknown>;
  requestIdFromMetadata: string | undefined;
  isBusy: boolean;
  onApprove: (requestId: string) => void | Promise<void>;
  onReject: (requestId: string) => void | Promise<void>;
}) {
  const { t } = useLanguage();
  const { ownsHousehold, currentUser, refresh } = useExpenses();
  const [resolvedRequestId, setResolvedRequestId] = useState<string | undefined>(
    requestIdFromMetadata,
  );
  const [lookupError, setLookupError] = useState<string | null>(null);

  const householdId = getString(notificationData.household_id);
  const requesterId = getString(notificationData.requester_id);

  // Backfill missing request_id once (older notifications may not include it).
  if (
    !resolvedRequestId &&
    !lookupError &&
    ownsHousehold &&
    householdId &&
    requesterId
  ) {
    void (async () => {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      const { data, error } = await supabase
        .from("household_join_requests")
        .select("id, status")
        .eq("household_id", householdId)
        .eq("requester_id", requesterId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        setLookupError(error.message);
        return;
      }
      if (data) {
        setResolvedRequestId(String(data.id));
      } else {
        setLookupError(t("notificationActionFailed"));
        await refresh();
      }
    })();
  }

  if (!ownsHousehold || !currentUser) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={isBusy || !resolvedRequestId}
        onClick={() => resolvedRequestId && void onApprove(resolvedRequestId)}
        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Check className="h-3.5 w-3.5" aria-hidden />
        {t("notificationApprove")}
      </button>
      <button
        type="button"
        disabled={isBusy || !resolvedRequestId}
        onClick={() => resolvedRequestId && void onReject(resolvedRequestId)}
        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-100 dark:hover:bg-gray-700"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
        {t("notificationReject")}
      </button>
      {lookupError && (
        <span className="text-xs font-medium text-red-600 dark:text-red-400">
          {lookupError}
        </span>
      )}
    </div>
  );
}
