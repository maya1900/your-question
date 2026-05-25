import Link from "next/link";
import { LogOut, Shield, Bell } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { getCurrentUser } from "@/lib/session";
import { getUnreadNotificationCount } from "@/lib/data";

export async function AppHeader() {
  const user = await getCurrentUser();
  const unreadCount = user ? await getUnreadNotificationCount(user.id) : 0;

  return (
    <header className="app-header">
      <div className="topbar">
        <Link className="brand" href="/" aria-label="栈问社区首页">
          <span className="brand-mark">问</span>
          <span>栈问</span>
        </Link>
        <nav className="nav-links" aria-label="主导航">
          <Link className="nav-link" href="/">
            问题
          </Link>
          <Link className="nav-link" href="/tags">
            标签
          </Link>
          <Link className="nav-link" href="/profile">
            积分
          </Link>
          {user?.role === "ADMIN" ? (
            <Link className="nav-link" href="/admin">
              管理
            </Link>
          ) : null}
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <Link
                className="icon-btn notification-btn"
                href="/notifications"
                aria-label="通知中心"
                title="通知中心"
              >
                <Bell size={16} aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
                )}
              </Link>
              {user.role === "ADMIN" ? (
                <Link className="icon-btn" href="/admin" aria-label="管理后台" title="管理后台">
                  <Shield size={16} aria-hidden="true" />
                </Link>
              ) : null}
              <Link className="btn ghost" href="/profile">
                {user.name}
              </Link>
              <form action={logoutAction}>
                <button className="icon-btn" type="submit" aria-label="退出登录" title="退出登录">
                  <LogOut size={16} aria-hidden="true" />
                </button>
              </form>
            </>
          ) : (
            <Link className="btn ghost" href="/auth">
              登录
            </Link>
          )}
          <Link className="btn primary" href="/ask">
            提问
          </Link>
        </div>
      </div>
    </header>
  );
}
