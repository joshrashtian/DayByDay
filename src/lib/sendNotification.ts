import { invoke } from "@tauri-apps/api/core";

type NotificationInput = {
  title: string;
  body: string;
  fire_at: number;
}

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  fire_at: number;
};

/** Shows a notification right away. */
export function sendNotificationNow({ title, body }: { title: string; body: string }) {
  return invoke("send_notification", { title, body });
}

/**
 * Queues a notification for `fire_at` (unix ms). Pass a stable `id` to be able
 * to replace or cancel it later; scheduling the same id again replaces it.
 */
export function sendNotification({ item, id = crypto.randomUUID() }: { item: NotificationInput; id?: string }) {
  return invoke("schedule_notification", { item: { id, ...item } });
}

/** Replaces the entire pending queue in Rust with `items`. */
export function syncNotifications(items: NotificationItem[]) {
  return invoke("sync_notifications", { items });
}

export function cancelNotification({ id }: { id: string }) {
  return invoke("cancel_notification", { id });
}
