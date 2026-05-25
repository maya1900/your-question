import Link from "next/link";
import { Search } from "lucide-react";
import { AdminNav } from "@/app/admin/_components/admin-nav";
import { AdminPagination } from "@/app/admin/_components/pagination";
import { getAdminTags } from "@/lib/data";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminTagsPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const q = firstParam(raw.q)?.trim() ?? "";
  const page = Number(firstParam(raw.page) ?? "1");
  const { tags, pagination } = await getAdminTags({ query: q, page });

  return (
    <main className="page-shell admin-layout">
      <section className="page-title">
        <h1>标签管理</h1>
        <p>查看标签规模、公开问题数、已解决数和隐藏问题数，用于判断内容归类情况。</p>
      </section>
      <AdminNav current="/admin/tags" />

      <section className="panel">
        <div className="filter-strip">
          <form className="toolbar" action="/admin/tags">
            <div className="search-box" style={{ flex: "1 1 260px" }}>
              <Search size={18} aria-hidden="true" />
              <input type="search" name="q" defaultValue={q} placeholder="搜索标签名或 slug" />
            </div>
            <button className="btn" type="submit">
              搜索
            </button>
          </form>
        </div>

        <div className="admin-table">
          {tags.length ? (
            tags.map((tag) => (
              <div className="admin-row" key={tag.id}>
                <div>
                  <Link className="admin-row-title" href={`/?tag=${tag.slug}`}>
                    {tag.name}
                  </Link>
                  <p>{tag.slug}</p>
                </div>
                <div className="admin-row-metrics">
                  <span>{tag.questionCount} 总问题</span>
                  <span>{tag.visibleQuestionCount} 公开</span>
                  <span>{tag.solvedQuestionCount} 已解决</span>
                  <span>{tag.hiddenQuestionCount} 隐藏</span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">没有匹配的标签。</div>
          )}
        </div>

        <AdminPagination basePath="/admin/tags" params={{ q }} pagination={pagination} />
      </section>
    </main>
  );
}
