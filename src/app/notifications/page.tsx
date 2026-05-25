import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getNotifications } from "@/lib/data";
import { formatRelativeTime } from "@/lib/format";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/app/actions";

export const dynamic = "force-dynamic";

function notificationIcon(type: string) {
  if (type === "QUESTION_ANSWERED") return "💬";
  if (type === "ANSWER_ACCEPTED") return "✅";
  if (type === "QUESTION_UPVOTED" || type === "ANSWER_UPVOTED") return "👍";
  return "🔔";
}

async function MarkAsReadButton({ notificationId }: { notificationId: string }) {
  return (
    <form action={markNotificationReadAction.bind(null, notificationId)}>
      <button type="submit" className="btn ghost small">
        标记已读
      </button>
    </form>
  );
}

async function MarkAllReadButton() {
  return (
    <form action={markAllNotificationsReadAction}>
      <button type="submit" className="btn ghost small">
        全部已读
      </button>
    </form>
  );
}

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const notifications = await getNotifications(user.id);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <main className="page-shell">
      <section className="page-grid">
        <div className="panel">
          <div className="panel-title">
            <h2>通知中心</h2>
            {unreadCount > 0 && <MarkAllReadButton />}
          </div>

          {notifications.length > 0 ? (
            <div className="notification-list">
              {notifications.map((notification) => {
                const linkHref = notification.questionId
                  ? `/questions/${notification.questionId}`
                  : "/";

                return (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.isRead ? "read" : "unread"}`}
                  >
                    <span className="notification-icon">{notificationIcon(notification.type)}</span>
                    <div className="notification-content">
                      <p>
                        {notification.actor && (
                          <strong>{notification.actor.name}</strong>
                        )}{" "}
                        {notification.message}
                      </p>
                      <div className="notification-meta">
                        <span className="hint">{formatRelativeTime(notification.createdAt)}</span>
                        {notification.questionId && (
                          <Link href={linkHref} className="link">
                            查看详情
                          </Link>
                        )}
                      </div>
                    </div>
                    {!notification.isRead && <MarkAsReadButton notificationId={notification.id} />}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">暂无通知</div>
          )}
        </div>
      </section>
    </main>
  );
}
