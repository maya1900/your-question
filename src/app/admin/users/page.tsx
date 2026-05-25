import Link from "next/link";
import { Search } from "lucide-react";
import { setUserActiveAction, deleteUserAction } from "@/app/actions";
import { AdminNav } from "@/app/admin/_components/admin-nav";
import { AdminPagination } from "@/app/admin/_components/pagination";
import { DeleteButton } from "@/app/admin/_components/delete-button";
import { getAdminUsers, type AdminUserStatus } from "@/lib/data";
import { formatRelativeTime, initials } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeStatus(value: string | undefined): AdminUserStatus {
  if (value === "active" || value === "inactive") return value;
  return "all";
}

function hrefWith(params: { q: string; status: AdminUserStatus }, patch: Partial<typeof params>) {
  const next = new URLSearchParams();
  const merged = { ...params, ...patch };
  if (merged.q) next.set("q", merged.q);
  if (merged.status !== "all") next.set("status", merged.status);
  const query = next.toString();
  return query ? `/admin/users?${query}` : "/admin/users";
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const [raw, currentUser] = await Promise.all([searchParams, getCurrentUser()]);
  const q = firstParam(raw.q)?.trim() ?? "";
  const status = normalizeStatus(firstParam(raw.status));
  const page = Number(firstParam(raw.page) ?? "1");
  const { users, pagination } = await getAdminUsers({ query: q, status, page });
  const redirectTo = hrefWith({ q, status }, {});

  return (
    <main className="page-shell admin-layout">
      <section className="page-title">
        <h1>用户管理</h1>
        <p>搜索用户、查看贡献和会话数量，并进入详情页编辑资料或重置密码。</p>
      </section>
      <AdminNav current="/admin/users" />

      <section className="panel">
        <div className="filter-strip">
          <form className="toolbar" action="/admin/users">
            <div className="search-box" style={{ flex: "1 1 260px" }}>
              <Search size={18} aria-hidden="true" />
              <input type="search" name="q" defaultValue={q} placeholder="搜索昵称或邮箱" />
            </div>
            {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
            <button className="btn" type="submit">
              搜索
            </button>
          </form>
          <div className="segmented" style={{ marginTop: 12 }}>
            {[
              { label: "全部", value: "all" as const },
              { label: "启用", value: "active" as const },
              { label: "停用", value: "inactive" as const }
            ].map((item) => (
              <Link aria-current={status === item.value} href={hrefWith({ q, status }, { status: item.value })} key={item.value}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="admin-table">
          {users.length ? (
            users.map((item) => (
              <div className="admin-row" key={item.id}>
                <div className="admin-user-cell">
                  <span className={`avatar ${item.role === "ADMIN" ? "info" : ""}`}>{initials(item.name)}</span>
                  <div>
                    <Link className="admin-row-title" href={`/admin/users/${item.id}`}>
                      {item.name}
                    </Link>
                    <p>
                      {item.email} · {item.role === "ADMIN" ? "管理员" : "普通用户"} · {item.isActive ? "启用" : "停用"} ·
                      注册于 {formatRelativeTime(item.createdAt)}
                    </p>
                    <div className="admin-row-metrics">
                      <span>{item._count.questions} 问</span>
                      <span>{item._count.answers} 答</span>
                      <span>{item._count.votes} 赞</span>
                      <span>{item._count.sessions} 会话</span>
                    </div>
                  </div>
                </div>
                <div className="admin-row-metrics">
                  <Link className="btn small" href={`/admin/users/${item.id}`}>
                    编辑
                  </Link>
                  <form action={setUserActiveAction}>
                    <input type="hidden" name="userId" value={item.id} />
                    <input type="hidden" name="active" value={item.isActive ? "false" : "true"} />
                    <input type="hidden" name="redirectTo" value={redirectTo} />
                    <button className="btn small" type="submit" disabled={item.id === currentUser?.id}>
                      {item.isActive ? "停用" : "启用"}
                    </button>
                  </form>
                  <DeleteButton
                    action={deleteUserAction}
                    confirmMessage={`确定要删除用户「${item.name}」吗？\n\n此操作将永久删除该用户的所有问题、回答、投票和积分记录，且无法恢复。`}
                    hiddenFields={{ userId: item.id, redirectTo }}
                    disabled={item.id === currentUser?.id}
                  />
                  <span className="score-pill">{item.score}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">没有匹配的用户。</div>
          )}
        </div>

        <AdminPagination
          basePath="/admin/users"
          params={{ q, status: status === "all" ? undefined : status }}
          pagination={pagination}
        />
      </section>
    </main>
  );
}
