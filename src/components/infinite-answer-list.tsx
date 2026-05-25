"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { acceptAnswerAction } from "@/app/actions";
import { AnswerVoteForm } from "@/components/vote-form";
import { RichTextViewer } from "@/components/rich-text-viewer";
import { SubmitButton } from "@/components/submit-button";
import { formatRelativeTime, initials } from "@/lib/format";

type AnswerItem = {
  id: string;
  summary: string | null;
  body: string;
  authorId: string;
  createdAt: string | Date;
  author: {
    id: string;
    name: string;
    score: number;
  };
  voteCount: number;
  voted: boolean;
  disabled: boolean;
  accepted: boolean;
};

export function InfiniteAnswerList({
  questionId,
  initialItems,
  initialNextPage,
  canAccept
}: {
  questionId: string;
  initialItems: AnswerItem[];
  initialNextPage: number | null;
  canAccept: boolean;
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
        fetch(`/api/questions/${questionId}/answers?page=${nextPage}`)
          .then((response) => {
            if (!response.ok) throw new Error("Failed to load answers");
            return response.json() as Promise<{ items: AnswerItem[]; nextPage: number | null }>;
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
  }, [loading, nextPage, questionId]);

  return (
    <div className="answer-list">
      {items.length ? (
        items.map((answer) => (
          <article className={`answer-card ${answer.accepted ? "accepted" : ""}`} id={`answer-${answer.id}`} key={answer.id}>
            <div className="answer-meta">
              {answer.accepted ? <span className="status-pill solved">最佳答案</span> : null}
              <Link href={`/profile?userId=${answer.author.id}`}>
                <span className="avatar accent">{initials(answer.author.name)}</span>
              </Link>
              <Link href={`/profile?userId=${answer.author.id}`} className="link">
                <strong>{answer.author.name}</strong>
              </Link>
              <span className="score-pill">{answer.author.score} pts</span>
              <span>{formatRelativeTime(answer.createdAt)}</span>
            </div>
            <div className="answer-content">
              {answer.summary ? (
                <p>
                  <strong>{answer.summary}</strong>
                </p>
              ) : null}
              <RichTextViewer content={answer.body} />
            </div>
            <div className="button-row" style={{ marginTop: 14 }}>
              <AnswerVoteForm
                answerId={answer.id}
                count={answer.voteCount}
                active={answer.voted}
                disabled={answer.disabled}
              />
              {canAccept ? (
                <form action={acceptAnswerAction}>
                  <input type="hidden" name="answerId" value={answer.id} />
                  <SubmitButton className="vote-button">
                    <Check size={14} aria-hidden="true" /> {answer.accepted ? "已采纳" : "采纳"}
                  </SubmitButton>
                </form>
              ) : null}
            </div>
          </article>
        ))
      ) : (
        <div className="empty-state">还没有回答。抢个头答，积分就来了。</div>
      )}
      <div ref={sentinelRef} className="load-sentinel" aria-hidden="true" />
      {loading ? <div className="empty-state">正在加载更多回答...</div> : null}
    </div>
  );
}
