"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { compactNumber, formatRelativeTime } from "@/lib/format";
import type { QuestionSort } from "@/lib/data";

type QuestionItem = {
  id: string;
  title: string;
  body: string;
  views: number;
  acceptedAnswerId: string | null;
  createdAt: string | Date;
  author: {
    id: string;
    name: string;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  voteCount: number;
  answerCount: number;
};

type InfiniteQuestionListProps = {
  initialItems: QuestionItem[];
  initialNextPage: number | null;
  sort: QuestionSort;
  tag: string;
  query: string;
};

function hrefWith(params: { sort: QuestionSort; tag: string; q: string }, patch: Partial<typeof params>) {
  const next = new URLSearchParams();
  const merged = { ...params, ...patch };
  if (merged.sort !== "hot") next.set("sort", merged.sort);
  if (merged.tag && merged.tag !== "all") next.set("tag", merged.tag);
  if (merged.q) next.set("q", merged.q);
  const query = next.toString();
  return query ? `/?${query}` : "/";
}

export function InfiniteQuestionList({
  initialItems,
  initialNextPage,
  sort,
  tag,
  query
}: InfiniteQuestionListProps) {
  const [items, setItems] = useState(initialItems);
  const [nextPage, setNextPage] = useState(initialNextPage);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const params = { sort, tag, q: query };

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !nextPage || loading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setLoading(true);
        const search = new URLSearchParams({ page: String(nextPage) });
        if (sort !== "hot") search.set("sort", sort);
        if (tag && tag !== "all") search.set("tag", tag);
        if (query) search.set("q", query);

        fetch(`/api/questions?${search.toString()}`)
          .then((response) => {
            if (!response.ok) throw new Error("Failed to load questions");
            return response.json() as Promise<{ items: QuestionItem[]; nextPage: number | null }>;
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
  }, [loading, nextPage, query, sort, tag]);

  return (
    <div className="question-list">
      {items.length ? (
        items.map((question) => (
          <article className="question-card" key={question.id}>
            <div className="vote-stack">
              <span className="metric">
                <strong>{question.voteCount}</strong>
                <span>票</span>
              </span>
              <span className="metric">
                <strong>{question.answerCount}</strong>
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
                  提问者{" "}
                  <Link href={`/profile?userId=${question.author.id}`} className="link">
                    <strong>{question.author.name}</strong>
                  </Link>
                </span>
                <span>{formatRelativeTime(question.createdAt)}</span>
              </div>
            </div>
          </article>
        ))
      ) : (
        <div className="empty-state">没有匹配的问题。换个标签或关键词试试。</div>
      )}
      <div ref={sentinelRef} className="load-sentinel" aria-hidden="true" />
      {loading ? <div className="empty-state">正在加载更多问题...</div> : null}
    </div>
  );
}
