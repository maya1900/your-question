import Link from "next/link";
import { Activity, FileQuestion, MessageSquare, Tags, ThumbsUp, Users } from "lucide-react";
import { setAnswerHiddenAction, setQuestionHiddenAction, setUserActiveAction } from "@/app/actions";
import { AdminNav } from "@/app/admin/_components/admin-nav";
import { getAdminDashboard } from "@/lib/data";
import { compactNumber, formatRelativeTime, initials } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

function eventTitle(type: string) {
  const titles: Record<string, string> = {
    QUESTION_CREATED: "发布问题",
    ANSWER_CREATED: "提交回答",
    QUESTION_UPVOTED: "问题获得点赞",
    QUESTION_UNVOTED: "问题点赞取消",
    ANSWER_UPVOTED: "回答获得点赞",
    ANSWER_UNVOTED: "回答点赞取消",
    ANSWER_ACCEPTED: "回答被采纳",
    ANSWER_UNACCEPTED: "采纳被改选"
  };
  return titles[type] ?? "积分变化";
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const dashboard = await getAdminDashboard();
  const solvedRate = dashboard.stats.questionCount
    ? Math.round((dashboard.stats.solvedQuestionCount / dashboard.stats.questionCount) * 100)
    : 0;

  return (
    <main className="page-shell admin-layout">
      <section className="page-title">
        <h1>管理后台</h1>
        <p>管理用户状态、隐藏问题和回答，并查看社区内容、互动和积分流水。</p>
      </section>
      <AdminNav current="/admin" />

      <section className="admin-stats" aria-label="管理概览">
        <div className="summary-box">
          <Users size={18} aria-hidden="true" />
          <strong>{dashboard.stats.userCount}</strong>
          <span>用户</span>
          <Link className="summary-link" href="/admin/users">
            管理用户
          </Link>
        </div>
        <div className="summary-box">
          <FileQuestion size={18} aria-hidden="true" />
          <strong>{dashboard.stats.questionCount}</strong>
          <span>问题</span>
          <Link className="summary-link" href="/admin/questions">
            管理问题
          </Link>
        </div>
        <div className="summary-box">
          <MessageSquare size={18} aria-hidden="true" />
          <strong>{dashboard.stats.answerCount}</strong>
          <span>回答</span>
          <Link className="summary-link" href="/admin/answers">
            管理回答
          </Link>
        </div>
        <div className="summary-box">
          <ThumbsUp size={18} aria-hidden="true" />
          <strong>{dashboard.stats.voteCount}</strong>
          <span>点赞</span>
        </div>
        <div className="summary-box">
          <Tags size={18} aria-hidden="true" />
          <strong>{dashboard.stats.tagCount}</strong>
          <span>标签</span>
          <Link className="summary-link" href="/admin/tags">
            管理标签
          </Link>
        </div>
        <div className="summary-box">
          <Activity size={18} aria-hidden="true" />
          <strong>{solvedRate}%</strong>
          <span>解决率</span>
        </div>
      </section>

      <section className="page-grid with-sidebar admin-grid">
        <div className="side-stack">
          <section className="panel">
            <div className="panel-title">
              <div>
                <h2>最新问题</h2>
                <p>按发布时间倒序展示。</p>
              </div>
            </div>
            <div className="admin-table">
              {dashboard.recentQuestions.map((question) => (
                <div className="admin-row" key={question.id}>
                  <div>
                    <Link className="admin-row-title" href={`/questions/${question.id}`}>
                      {question.title}
                    </Link>
                    <p>
                      {question.author.name} · {formatRelativeTime(question.createdAt)}
                      {question.hiddenAt ? " · 已隐藏" : ""}
                    </p>
                    <div className="tag-cloud">
                      {question.tags.map(({ tag }) => (
                        <span className="tag" key={tag.id}>
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="admin-row-metrics">
                    <form action={setQuestionHiddenAction}>
                      <input type="hidden" name="questionId" value={question.id} />
                      <input type="hidden" name="hidden" value={question.hiddenAt ? "false" : "true"} />
                      <button className="btn small" type="submit">
                        {question.hiddenAt ? "恢复" : "隐藏"}
                      </button>
                    </form>
                    <span>{question._count.votes} 赞</span>
                    <span>{question._count.answers} 答</span>
                    <span>{compactNumber(question.views)} 阅</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">
              <div>
                <h2>最新回答</h2>
                <p>用于快速发现活跃讨论。</p>
              </div>
            </div>
            <div className="admin-table">
              {dashboard.recentAnswers.map((answer) => (
                <div className="admin-row compact" key={answer.id}>
                  <div>
                    <Link className="admin-row-title" href={`/questions/${answer.questionId}#answer-${answer.id}`}>
                      {answer.summary ?? answer.body.slice(0, 42)}
                    </Link>
                    <p>
                      {answer.author.name} 回答《{answer.question.title}》 · {formatRelativeTime(answer.createdAt)}
                      {answer.hiddenAt ? " · 已隐藏" : ""}
                    </p>
                  </div>
                  <div className="admin-row-metrics">
                    <form action={setAnswerHiddenAction}>
                      <input type="hidden" name="answerId" value={answer.id} />
                      <input type="hidden" name="questionId" value={answer.questionId} />
                      <input type="hidden" name="hidden" value={answer.hiddenAt ? "false" : "true"} />
                      <button className="btn small" type="submit">
                        {answer.hiddenAt ? "恢复" : "隐藏"}
                      </button>
                    </form>
                    <span>{answer._count.votes} 赞</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="side-stack">
          <section className="panel">
            <div className="panel-title">
              <div>
                <h2>用户</h2>
                <p>最新注册和贡献概况。</p>
              </div>
            </div>
            <div className="rank-list">
              {dashboard.recentUsers.map((item) => (
                <div className="rank-item" key={item.id}>
                  <span className={`avatar ${item.role === "ADMIN" ? "info" : ""}`}>{initials(item.name)}</span>
                  <span>
                    <strong>{item.name}</strong>
                    <small>
                      {item.email} · {item.isActive ? "启用" : "停用"} · {item._count.questions} 问 / {item._count.answers} 答
                    </small>
                  </span>
                  <div className="admin-row-metrics">
                    <form action={setUserActiveAction}>
                      <input type="hidden" name="userId" value={item.id} />
                      <input type="hidden" name="active" value={item.isActive ? "false" : "true"} />
                      <button className="btn small" type="submit" disabled={item.id === user.id}>
                        {item.isActive ? "停用" : "启用"}
                      </button>
                    </form>
                    <span className="score-pill">{item.role === "ADMIN" ? "ADMIN" : item.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">
              <div>
                <h2>积分流水</h2>
                <p>最近 {dashboard.recentScoreEvents.length} 条。</p>
              </div>
            </div>
            <div className="activity-list">
              {dashboard.recentScoreEvents.map((event) => (
                <div className="activity-item" key={event.id}>
                  <span className={`avatar ${event.points > 0 ? "accent" : ""}`}>{event.points > 0 ? "+" : "-"}</span>
                  <div>
                    <strong>{eventTitle(event.type)}</strong>
                    <p>
                      {event.user.name}
                      {event.actor ? ` · 操作人 ${event.actor.name}` : ""} · {formatRelativeTime(event.createdAt)}
                    </p>
                  </div>
                  <span className="score-pill">
                    {event.points > 0 ? "+" : ""}
                    {event.points}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
