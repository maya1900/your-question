"use client";

import { useActionState } from "react";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/app/actions";

export function MarkAsReadButton({ notificationId }: { notificationId: string }) {
  const [, formAction] = useActionState(markNotificationReadAction, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="notificationId" value={notificationId} />
      <button type="submit" className="btn ghost small">
        标记已读
      </button>
    </form>
  );
}

export function MarkAllReadButton() {
  const [, formAction] = useActionState(markAllNotificationsReadAction, {});

  return (
    <form action={formAction}>
      <button type="submit" className="btn ghost small">
        全部已读
      </button>
    </form>
  );
}
