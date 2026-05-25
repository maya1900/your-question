import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { notFound } from "next/navigation";
import { acceptAnswerAction } from "@/app/actions";
import { AnswerForm } from "@/components/answer-form";
import { SubmitButton } from "@/components/submit-button";
import { AnswerVoteForm, QuestionVoteForm } from "@/components/vote-form";
import { getQuestionById, getRelatedQuestions } from "@/lib/data";
import { compactNumber, formatRelativeTime, initials } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const question = await prisma.question.findUnique({
    where: { id },
    select: { title: true, body: true }
  });

  if (!question) return { title: "问题不存在 · 栈问" };
  return {
    title: `${question.title} · 栈问`,
    description: question.body.slice(0, 120)
  };
}

function noticeText(value: string | string[] | undefined) {
  const notice = Array.isArray(value) ? value[0] : value;
  if (notice === "self-vote") return "不能给自己的内容点赞。";
  if (notice === "no-permission") return "只有提问者可以采纳答案。";
  return null;
}

export default async function QuestionDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, rawSearch, user] = await Promise.all([params, searchParams, getCurrentUser()]);

  await prisma.question
    .update({
      where: { id },
      data: { views: { increment: 1 } }
    })
    .catch(() => null);

  const question = await getQuestionById(id);
  if (!question || question.hiddenAt || !question.author.isActive) notFound();

  const related = await getRelatedQuestions(
    question.id,
    question.tags.map(({ tag }) => tag.slug)
  );
  const notice = noticeText(rawSearch.notice);
  const canAccept = user?.id === question.authorId;
  const questionVoted = user ? question.votes.some((vote) => vote.userId === user.id) : false;
  const answers = [...question.answers].sort((a, b) => {
    if (a.id === question.acceptedAnswerId) return -1;
    if (b.id === question.acceptedAnswerId) return 1;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  return (
    <main className="page-shell">
      {notice ? <p className="notice">{notice}</p> : null}
      <section className="page-grid with-sidebar">
        <article className="question-detail">
          <div className="panel detail-head">
            <div className="question-meta" style={{ marginBottom: 12 }}>
              <span className={`status-pill ${question.acceptedAnswerId ? "solved" : "open"}`}>
                {question.acceptedAnswerId ? "已解决" : "未解决"}
              </span>
              {question.tags.map(({ tag }) => (
                <Link className="tag" href={`/?tag=${tag.slug}`} key={tag.id}>
                  {tag.name}
                </Link>
              ))}
              <span>
                提问者 <strong>{question.author.name}</strong>
              </span>
              <span>{formatRelativeTime(question.createdAt)}</span>
            </div>
            <h1>{question.title}</h1>
            <div className="detail-body">
              <p>{question.body}</p>
              {question.details ? (
                <pre className="code-block">
                  <code>{question.details}</code>
                </pre>
              ) : null}
            </div>
            <div className="button-row" style={{ marginTop: 16 }}>
              <QuestionVoteForm
                questionId={question.id}
                count={question.votes.length}
                active={questionVoted}
                disabled={user?.id === question.authorId}
              />
              {!user ? (
                <Link className="btn small" href="/auth">
                  登录后点赞
                </Link>
              ) : null}
            </div>
          </div>

          <section className="panel" style={{ marginTop: 20 }}>
            <div className="panel-title">
              <div>
                <h2>{answers.length} 个回答</h2>
                <p>提问者可以采纳一个最佳答案。</p>
              </div>
            </div>
            <div className="answer-list">
              {answers.length ? (
                answers.map((answer) => {
                  const accepted = answer.id === question.acceptedAnswerId;
                  const voted = user ? answer.votes.some((vote) => vote.userId === user.id) : false;

                  return (
                    <article className={`answer-card ${accepted ? "accepted" : ""}`} id={`answer-${answer.id}`} key={answer.id}>
                      <div className="answer-meta">
                        {accepted ? <span className="status-pill solved">最佳答案</span> : null}
                        <span className="avatar accent">{initials(answer.author.name)}</span>
                        <strong>{answer.author.name}</strong>
                        <span className="score-pill">{answer.author.score} pts</span>
                        <span>{formatRelativeTime(answer.createdAt)}</span>
                      </div>
                      <div className="answer-content">
                        {answer.summary ? <p><strong>{answer.summary}</strong></p> : null}
                        <p>{answer.body}</p>
                      </div>
                      <div className="button-row" style={{ marginTop: 14 }}>
                        <AnswerVoteForm
                          answerId={answer.id}
                          count={answer.votes.length}
                          active={voted}
                          disabled={user?.id === answer.authorId}
                        />
                        {canAccept ? (
                          <form action={acceptAnswerAction}>
                            <input type="hidden" name="answerId" value={answer.id} />
                            <SubmitButton className="vote-button">
                              <Check size={14} aria-hidden="true" /> {accepted ? "已采纳" : "采纳"}
                            </SubmitButton>
                          </form>
                        ) : null}
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="empty-state">还没有回答。抢个头答，积分就来了。</div>
              )}
            </div>
          </section>

          <section className="panel pad" style={{ marginTop: 20 }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>写回答</h2>
            {user ? (
              <AnswerForm questionId={question.id} />
            ) : (
              <div className="button-row">
                <Link className="btn primary" href="/auth">
                  登录后回答
                </Link>
                <span className="hint">有效回答会获得积分。</span>
              </div>
            )}
          </section>
        </article>

        <aside className="side-stack">
          <section className="panel pad">
            <h2 style={{ margin: "0 0 12px", fontSize: 16 }}>问题状态</h2>
            <div className="stats-grid">
              <div className="stat">
                <strong>{question.votes.length}</strong>
                <span>赞同</span>
              </div>
              <div className="stat">
                <strong>{answers.length}</strong>
                <span>回答</span>
              </div>
              <div className="stat">
                <strong>{compactNumber(question.views)}</strong>
                <span>浏览</span>
              </div>
              <div className="stat">
                <strong>+25</strong>
                <span>采纳奖励</span>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">
              <div>
                <h2>相关问题</h2>
                <p>继续查看相近标签。</p>
              </div>
            </div>
            <div className="rank-list">
              {related.length ? (
                related.map((item) => (
                  <Link className="rank-item" href={`/questions/${item.id}`} key={item.id}>
                    <span className="tag">{item.tags[0]?.tag.name ?? "问题"}</span>
                    <span>{item.title}</span>
                    <span />
                  </Link>
                ))
              ) : (
                <div className="empty-state">暂无相关问题。</div>
              )}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
