import Link from "next/link";
import { Plus, Search } from "lucide-react";
import {
  defaultTagFilters,
  getLeaderboard,
  getQuestionStats,
  getQuestions,
  getTags,
  type QuestionSort
} from "@/lib/data";
import { compactNumber, formatRelativeTime, initials } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeSort(value: string | undefined): QuestionSort {
  if (value === "latest" || value === "unsolved") return value;
  return "hot";
}

function hrefWith(params: { sort: QuestionSort; tag: string; q: string }, patch: Partial<typeof params>) {
  const next = new URLSearchParams();
  const merged = { ...params, ...patch };
  if (merged.sort !== "hot") next.set("sort", merged.sort);
  if (merged.tag && merged.tag !== "all") next.set("tag", merged.tag);
  if (merged.q) next.set("q", merged.q);
  const query = next.toString();
  return query ? `/?${query}` : "/";
}

export default async function HomePage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const sort = normalizeSort(firstParam(raw.sort));
  const tag = firstParam(raw.tag) ?? "all";
  const q = firstParam(raw.q) ?? "";

  const [questions, tags, stats, leaderboard, user] = await Promise.all([
    getQuestions({ sort, tag, query: q }),
    getTags(),
    getQuestionStats(),
    getLeaderboard(),
    getCurrentUser()
  ]);

  const filters = [
    ...defaultTagFilters(),
    ...tags
      .filter((item) => !defaultTagFilters().some((filter) => filter.slug === item.slug))
      .slice(0, 8)
      .map((item) => ({ label: item.name, slug: item.slug }))
  ];
  const params = { sort, tag, q };

  return (
    <main className="page-shell">
      <section className="hero-strip">
        <div>
          <h1>问题列表</h1>
          <p>筛出你能回答的问题，把经验沉淀给后来的人。未解决问题会优先露出，采纳后自动归档。</p>
        </div>
        <div className="hero-actions">
          <Link className="btn primary" href={user ? "/ask" : "/auth"}>
            <Plus size={16} aria-hidden="true" /> 发布问题
          </Link>
        </div>
      </section>

      <section className="page-grid with-sidebar">
        <div className="panel">
          <div className="panel-title">
            <div>
              <h2>全部问题</h2>
              <p>支持按热度、最新、未解决排序。</p>
            </div>
          </div>
          <div className="filter-strip">
            <form className="toolbar" action="/">
              <div className="search-box" style={{ flex: "1 1 260px" }}>
                <Search size={18} aria-hidden="true" />
                <input type="search" name="q" defaultValue={q} placeholder="搜索问题、标签或作者" />
              </div>
              {sort !== "hot" ? <input type="hidden" name="sort" value={sort} /> : null}
              {tag !== "all" ? <input type="hidden" name="tag" value={tag} /> : null}
              <button className="btn" type="submit">
                搜索
              </button>
            </form>
            <div className="toolbar" style={{ marginTop: 12, justifyContent: "space-between" }}>
              <div className="segmented" aria-label="排序方式">
                <Link aria-current={sort === "hot"} href={hrefWith(params, { sort: "hot" })}>
                  热度
                </Link>
                <Link aria-current={sort === "latest"} href={hrefWith(params, { sort: "latest" })}>
                  最新
                </Link>
                <Link aria-current={sort === "unsolved"} href={hrefWith(params, { sort: "unsolved" })}>
                  未解决
                </Link>
              </div>
              <div className="chip-row">
                {filters.map((filter) => (
                  <Link
                    className="tag"
                    aria-current={tag === filter.slug}
                    key={filter.slug}
                    href={hrefWith(params, { tag: filter.slug })}
                  >
                    {filter.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="question-list">
            {questions.length ? (
              questions.map((question) => (
                <article className="question-card" key={question.id}>
                  <div className="vote-stack">
                    <span className="metric">
                      <strong>{question.votes.length}</strong>
                      <span>票</span>
                    </span>
                    <span className="metric">
                      <strong>{question.answers.length}</strong>
                      <span>答</span>
                    </span>
                    <span className="metric">
                      <strong>{compactNumber(question.views)}</strong>
                      <span>阅</span>
                    </span>
                  </div>
                  <div className="question-main">
                    <h2 className="question-title">
                      <Link href={`/questions/${question.id}`}>{question.title}</Link>
                    </h2>
                    <p className="question-excerpt">{question.body}</p>
                    <div className="question-meta">
                      <span className={`status-pill ${question.acceptedAnswerId ? "solved" : "open"}`}>
                        {question.acceptedAnswerId ? "已解决" : "未解决"}
                      </span>
                      {question.tags.map(({ tag: item }) => (
                        <Link className="tag" href={hrefWith(params, { tag: item.slug })} key={item.id}>
                          {item.name}
                        </Link>
                      ))}
                      <span>
                        提问者 <strong>{question.author.name}</strong>
                      </span>
                      <span>{formatRelativeTime(question.createdAt)}</span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">没有匹配的问题。换个标签或关键词试试。</div>
            )}
          </div>
        </div>

        <aside className="side-stack">
          <section className="panel pad">
            <h2 style={{ margin: "0 0 12px", fontSize: 16 }}>今日概览</h2>
            <div className="stats-grid">
              <div className="stat">
                <strong>{stats.questionCount}</strong>
                <span>问题</span>
              </div>
              <div className="stat">
                <strong>{stats.answerCount}</strong>
                <span>回答</span>
              </div>
              <div className="stat">
                <strong>{stats.unsolvedCount}</strong>
                <span>未解决</span>
              </div>
              <div className="stat">
                <strong>{stats.tagCount}</strong>
                <span>标签</span>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">
              <div>
                <h2>积分榜</h2>
                <p>社区贡献排名。</p>
              </div>
            </div>
            <div className="rank-list">
              {leaderboard.map((item, index) => (
                <Link className="rank-item" href="/profile" key={item.id}>
                  <span className={`avatar ${index === 0 ? "accent" : index === 1 ? "info" : ""}`}>
                    {initials(item.name)}
                  </span>
                  <span>{item.name}</span>
                  <span className="score-pill">{item.score}</span>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
