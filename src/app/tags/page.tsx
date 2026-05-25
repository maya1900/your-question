import Link from "next/link";
import { Search } from "lucide-react";
import { getTags } from "@/lib/data";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TagsPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const q = firstParam(raw.q)?.trim() ?? "";
  const tags = await getTags();
  const visible = q
    ? tags.filter((tag) => `${tag.name} ${tag.slug}`.toLowerCase().includes(q.toLowerCase()))
    : tags;

  const hotThemes = tags
    .slice(0, 3)
    .map((tag) => ({
      name: tag.name,
      unresolved: tag.questions.filter(({ question }) => !question.acceptedAnswerId).length,
      solved: tag.questions.filter(({ question }) => question.acceptedAnswerId).length
    }));

  return (
    <main className="page-shell tags-layout">
      <section className="panel pad">
        <div className="page-title">
          <h1>标签筛选</h1>
          <p>从标签快速进入主题页，也能看出哪些话题更热、哪些问题还没人回答。</p>
        </div>
        <form className="search-box" style={{ marginBottom: 16, maxWidth: 520 }} action="/tags">
          <Search size={18} aria-hidden="true" />
          <input type="search" name="q" defaultValue={q} placeholder="搜索标签" />
        </form>
        <div className="tag-grid">
          {visible.length ? (
            visible.map((tag) => (
              <article className="tag-card" key={tag.id}>
                <div className="rank-row">
                  <h3>{tag.name}</h3>
                  <span className="status-pill open">{tag._count.questions} 个问题</span>
                </div>
                <p>
                  {tag.questions.filter(({ question }) => !question.acceptedAnswerId).length} 个未解决，
                  {tag.questions.filter(({ question }) => question.acceptedAnswerId).length} 个已采纳。
                </p>
                <div className="tag-cloud">
                  <Link className="tag selected" href={`/?tag=${tag.slug}`}>
                    查看问题
                  </Link>
                  <span className="tag">{tag.slug}</span>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">没有匹配的标签。换个关键词试试。</div>
          )}
        </div>
      </section>

      <aside className="side-stack">
        <section className="summary-card">
          <h3>热门主题</h3>
          <div className="preview-list">
            {hotThemes.map((theme) => (
              <div className="preview-item" key={theme.name}>
                <strong>{theme.name}</strong>
                <span>{theme.unresolved} 个未解决问题</span>
                <span className="score-pill">{theme.solved} 采纳</span>
              </div>
            ))}
          </div>
        </section>
        <section className="preview-card">
          <h3>筛选逻辑</h3>
          <p>先找标签，再看未解决问题，能更快找到你能回答的场景。</p>
        </section>
      </aside>
    </main>
  );
}
