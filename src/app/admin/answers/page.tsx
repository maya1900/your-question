import Link from "next/link";
import { Search } from "lucide-react";
import { setAnswerHiddenAction } from "@/app/actions";
import { AdminNav } from "@/app/admin/_components/admin-nav";
import { AdminPagination } from "@/app/admin/_components/pagination";
import { getAdminAnswers, type AdminContentStatus, type AdminSort } from "@/lib/data";
import { formatRelativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeStatus(value: string | undefined): AdminContentStatus {
  if (value === "visible" || value === "hidden") return value;
  return "all";
}

function normalizeSort(value: string | undefined): AdminSort {
  return value === "oldest" ? "oldest" : "latest";
}

function hrefWith(params: { q: string; status: AdminContentStatus; sort: AdminSort }, patch: Partial<typeof params>) {
  const next = new URLSearchParams();
  const merged = { ...params, ...patch };
  if (merged.q) next.set("q", merged.q);
  if (merged.status !== "all") next.set("status", merged.status);
  if (merged.sort !== "latest") next.set("sort", merged.sort);
  const query = next.toString();
  return query ? `/admin/answers?${query}` : "/admin/answers";
}

export default async function AdminAnswersPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const q = firstParam(raw.q)?.trim() ?? "";
  const status = normalizeStatus(firstParam(raw.status));
  const sort = normalizeSort(firstParam(raw.sort));
  const page = Number(firstParam(raw.page) ?? "1");
  const { answers, pagination } = await getAdminAnswers({ query: q, status, sort, page });
  const redirectTo = hrefWith({ q, status, sort }, {});

  return (
    <main className="page-shell admin-layout">
      <section className="page-title">
        <h1>回答管理</h1>
        <p>查看回答内容、所属问题和作者，必要时隐藏或恢复回答。</p>
      </section>
      <AdminNav current="/admin/answers" />

      <section className="panel">
        <div className="filter-strip">
          <form className="toolbar" action="/admin/answers">
            <div className="search-box" style={{ flex: "1 1 260px" }}>
              <Search size={18} aria-hidden="true" />
              <input type="search" name="q" defaultValue={q} placeholder="搜索回答、问题或作者" />
            </div>
            {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
            {sort !== "latest" ? <input type="hidden" name="sort" value={sort} /> : null}
            <button className="btn" type="submit">
              搜索
            </button>
          </form>
          <div className="admin-filter-row">
            <div className="segmented">
              {[
                { label: "全部", value: "all" as const },
                { label: "可见", value: "visible" as const },
                { label: "隐藏", value: "hidden" as const }
              ].map((item) => (
                <Link aria-current={status === item.value} href={hrefWith({ q, status, sort }, { status: item.value })} key={item.value}>
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="segmented">
              <Link aria-current={sort === "latest"} href={hrefWith({ q, status, sort }, { sort: "latest" })}>
                最新
              </Link>
              <Link aria-current={sort === "oldest"} href={hrefWith({ q, status, sort }, { sort: "oldest" })}>
                最早
              </Link>
            </div>
          </div>
        </div>

        <div className="admin-table">
          {answers.length ? (
            answers.map((answer) => {
              const excerpt = answer.summary || answer.body.slice(0, 72);
              return (
                <div className="admin-row" key={answer.id}>
                  <div>
                    <Link className="admin-row-title" href={`/questions/${answer.questionId}#answer-${answer.id}`}>
                      {excerpt}
                    </Link>
                    <p>
                      {answer.author.name} · {answer.author.email} · 回答《{answer.question.title}》 · {formatRelativeTime(answer.createdAt)}
                      {answer.hiddenAt ? " · 已隐藏" : ""}
                      {answer.question.hiddenAt ? " · 问题已隐藏" : ""}
                    </p>
                    <p>{answer.body}</p>
                  </div>
                  <div className="admin-row-metrics">
                    <form action={setAnswerHiddenAction}>
                      <input type="hidden" name="answerId" value={answer.id} />
                      <input type="hidden" name="questionId" value={answer.questionId} />
                      <input type="hidden" name="hidden" value={answer.hiddenAt ? "false" : "true"} />
                      <input type="hidden" name="redirectTo" value={redirectTo} />
                      <button className="btn small" type="submit">
                        {answer.hiddenAt ? "恢复" : "隐藏"}
                      </button>
                    </form>
                    {answer.question.acceptedAnswerId === answer.id ? <span className="status-pill solved">最佳</span> : null}
                    <span>{answer._count.votes} 赞</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state">没有匹配的回答。</div>
          )}
        </div>

        <AdminPagination
          basePath="/admin/answers"
          params={{ q, status: status === "all" ? undefined : status, sort: sort === "latest" ? undefined : sort }}
          pagination={pagination}
        />
      </section>
    </main>
  );
}
