import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnswerForm } from "@/components/answer-form";
import { InfiniteAnswerList } from "@/components/infinite-answer-list";
import { QuestionVoteForm } from "@/components/vote-form";
import { RichTextViewer } from "@/components/rich-text-viewer";
import { publicAnswerPageSize, getQuestionById, getRelatedQuestions } from "@/lib/data";
import { compactNumber, formatRelativeTime } from "@/lib/format";
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
  const initialAnswers = [...question.answers].sort((a, b) => {
    if (a.id === question.acceptedAnswerId) return -1;
    if (b.id === question.acceptedAnswerId) return 1;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
  const answers = initialAnswers.slice(0, publicAnswerPageSize);
  const nextAnswerPage = initialAnswers.length > publicAnswerPageSize ? 2 : null;

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
                提问者 <Link href={`/profile?userId=${question.author.id}`} className="link"><strong>{question.author.name}</strong></Link>
              </span>
              <span>{formatRelativeTime(question.createdAt)}</span>
            </div>
            <h1>{question.title}</h1>
            <div className="detail-body">
              <RichTextViewer content={question.body} />
              {question.details ? (
                <div style={{ marginTop: 16 }}>
                  <RichTextViewer content={question.details} />
                </div>
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
                <h2>{question._count.answers} 个回答</h2>
                <p>提问者可以采纳一个最佳答案。</p>
              </div>
            </div>
            <InfiniteAnswerList
              key={`${question.id}:${question.acceptedAnswerId ?? "open"}`}
              questionId={question.id}
              initialItems={answers.map((answer) => ({
                id: answer.id,
                summary: answer.summary,
                body: answer.body,
                authorId: answer.authorId,
                createdAt: answer.createdAt,
                author: answer.author,
                voteCount: answer.votes.length,
                voted: user ? answer.votes.some((vote) => vote.userId === user.id) : false,
                disabled: user?.id === answer.authorId,
                accepted: answer.id === question.acceptedAnswerId
              }))}
              initialNextPage={nextAnswerPage}
              canAccept={canAccept}
            />
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
                <strong>{question._count.answers}</strong>
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
