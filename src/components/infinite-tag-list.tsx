"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type TagItem = {
  id: string;
  name: string;
  slug: string;
  questionCount: number;
  solvedQuestionCount: number;
  unsolvedQuestionCount: number;
};

export function InfiniteTagList({
  initialItems,
  initialNextPage,
  query
}: {
  initialItems: TagItem[];
  initialNextPage: number | null;
  query: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [nextPage, setNextPage] = useState(initialNextPage);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !nextPage || loading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setLoading(true);
        const search = new URLSearchParams({ page: String(nextPage) });
        if (query) search.set("q", query);

        fetch(`/api/tags?${search.toString()}`)
          .then((response) => {
            if (!response.ok) throw new Error("Failed to load tags");
            return response.json() as Promise<{ items: TagItem[]; nextPage: number | null }>;
          })
          .then((payload) => {
            setItems((current) => [...current, ...payload.items]);
            setNextPage(payload.nextPage);
          })
          .catch(() => {
            setNextPage(null);
          })
          .finally(() => setLoading(false));
      },
      { rootMargin: "320px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, nextPage, query]);

  return (
    <div className="tag-grid">
      {items.length ? (
        items.map((tag) => (
          <article className="tag-card" key={tag.id}>
            <div className="rank-row">
              <h3>{tag.name}</h3>
              <span className="status-pill open">{tag.questionCount} 个问题</span>
            </div>
            <p>
              {tag.unsolvedQuestionCount} 个未解决，{tag.solvedQuestionCount} 个已采纳。
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
      <div ref={sentinelRef} className="load-sentinel" aria-hidden="true" />
      {loading ? <div className="empty-state">正在加载更多标签...</div> : null}
    </div>
  );
}
