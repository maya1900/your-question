import Link from "next/link";
import { Search } from "lucide-react";
import { setQuestionHiddenAction } from "@/app/actions";
import { AdminNav } from "@/app/admin/_components/admin-nav";
import { AdminPagination } from "@/app/admin/_components/pagination";
import { getAdminQuestions, type AdminQuestionStatus, type AdminSort } from "@/lib/data";
import { compactNumber, formatRelativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeStatus(value: string | undefined): AdminQuestionStatus {
  if (value === "visible" || value === "hidden" || value === "solved" || value === "unsolved") return value;
  return "all";
}

function normalizeSort(value: string | undefined): AdminSort {
  return value === "oldest" ? "oldest" : "latest";
}

function hrefWith(
  params: { q: string; status: AdminQuestionStatus; tag: string; sort: AdminSort },
  patch: Partial<typeof params>
) {
  const next = new URLSearchParams();
  const merged = { ...params, ...patch };
  if (merged.q) next.set("q", merged.q);
  if (merged.status !== "all") next.set("status", merged.status);
  if (merged.tag) next.set("tag", merged.tag);
  if (merged.sort !== "latest") next.set("sort", merged.sort);
  const query = next.toString();
  return query ? `/admin/questions?${query}` : "/admin/questions";
}

export default async function AdminQuestionsPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const q = firstParam(raw.q)?.trim() ?? "";
  const status = normalizeStatus(firstParam(raw.status));
  const tag = firstParam(raw.tag)?.trim() ?? "";
  const sort = normalizeSort(firstParam(raw.sort));
  const page = Number(firstParam(raw.page) ?? "1");
  const { questions, pagination } = await getAdminQuestions({ query: q, status, tag, sort, page });
  const redirectTo = hrefWith({ q, status, tag, sort }, {});

  return (
    <main className="page-shell admin-layout">
      <section className="page-title">
        <h1>问题管理</h1>
        <p>按关键词、标签和状态筛选问题，隐藏不适合公开展示的内容。</p>
      </section>
      <AdminNav current="/admin/questions" />

      <section className="panel">
        <div className="filter-strip">
          <form className="toolbar" action="/admin/questions">
            <div className="search-box" style={{ flex: "1 1 260px" }}>
              <Search size={18} aria-hidden="true" />
              <input type="search" name="q" defaultValue={q} placeholder="搜索标题、正文或作者" />
            </div>
            <input className="field compact-field" name="tag" defaultValue={tag} placeholder="标签 slug" />
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
                { label: "隐藏", value: "hidden" as const },
                { label: "已解决", value: "solved" as const },
                { label: "未解决", value: "unsolved" as const }
              ].map((item) => (
                <Link aria-current={status === item.value} href={hrefWith({ q, status, tag, sort }, { status: item.value })} key={item.value}>
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="segmented">
              <Link aria-current={sort === "latest"} href={hrefWith({ q, status, tag, sort }, { sort: "latest" })}>
                最新
              </Link>
              <Link aria-current={sort === "oldest"} href={hrefWith({ q, status, tag, sort }, { sort: "oldest" })}>
                最早
              </Link>
            </div>
          </div>
        </div>

        <div className="admin-table">
          {questions.length ? (
            questions.map((question) => (
              <div className="admin-row" key={question.id}>
                <div>
                  <Link className="admin-row-title" href={`/questions/${question.id}`}>
                    {question.title}
                  </Link>
                  <p>
                    {question.author.name} · {question.author.email} · {formatRelativeTime(question.createdAt)}
                    {question.hiddenAt ? " · 已隐藏" : ""}
                  </p>
                  <div className="tag-cloud">
                    <span className={`status-pill ${question.acceptedAnswerId ? "solved" : "open"}`}>
                      {question.acceptedAnswerId ? "已解决" : "未解决"}
                    </span>
                    {question.tags.map(({ tag: item }) => (
                      <Link className="tag" href={hrefWith({ q: "", status: "all", tag: item.slug, sort: "latest" }, {})} key={item.id}>
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="admin-row-metrics">
                  <form action={setQuestionHiddenAction}>
                    <input type="hidden" name="questionId" value={question.id} />
                    <input type="hidden" name="hidden" value={question.hiddenAt ? "false" : "true"} />
                    <input type="hidden" name="redirectTo" value={redirectTo} />
                    <button className="btn small" type="submit">
                      {question.hiddenAt ? "恢复" : "隐藏"}
                    </button>
                  </form>
                  <span>{question._count.votes} 赞</span>
                  <span>{question._count.answers} 答</span>
                  <span>{compactNumber(question.views)} 阅</span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">没有匹配的问题。</div>
          )}
        </div>

        <AdminPagination
          basePath="/admin/questions"
          params={{
            q,
            status: status === "all" ? undefined : status,
            tag,
            sort: sort === "latest" ? undefined : sort
          }}
          pagination={pagination}
        />
      </section>
    </main>
  );
}
