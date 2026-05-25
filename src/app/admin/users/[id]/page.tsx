import Link from "next/link";
import { notFound } from "next/navigation";
import { resetUserPasswordForAdminAction, updateUserForAdminAction } from "@/app/actions";
import { AdminNav } from "@/app/admin/_components/admin-nav";
import { SubmitButton } from "@/components/submit-button";
import { getAdminUserById } from "@/lib/data";
import { formatRelativeTime, initials } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function noticeText(value: string | string[] | undefined) {
  const notice = firstParam(value);
  if (notice === "email-conflict") return "邮箱已被其他用户使用。";
  if (notice === "no-permission") return "不能移除自己的管理员身份或停用自己。";
  if (notice === "user-updated") return "用户资料已更新。";
  if (notice === "password-reset") return "密码已重置，该用户现有会话已清理。";
  return null;
}

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

export default async function AdminUserDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, raw, currentUser] = await Promise.all([params, searchParams, getCurrentUser()]);
  const user = await getAdminUserById(id);
  if (!user) notFound();

  const notice = noticeText(raw.notice);
  const editingSelf = currentUser?.id === user.id;

  return (
    <main className="page-shell admin-layout">
      <section className="page-title">
        <h1>编辑用户</h1>
        <p>修改用户资料、角色和状态，或重置登录密码。</p>
      </section>
      <AdminNav current="/admin/users" />
      {notice ? <p className="notice">{notice}</p> : null}

      <section className="page-grid with-sidebar admin-grid">
        <div className="side-stack">
          <section className="panel pad">
            <div className="profile-id" style={{ marginBottom: 18 }}>
              <span className={`avatar ${user.role === "ADMIN" ? "info" : "accent"}`}>{initials(user.name)}</span>
              <div>
                <h1>{user.name}</h1>
                <p className="hint">
                  {user.email} · {user.role === "ADMIN" ? "管理员" : "普通用户"} · {user.isActive ? "启用" : "停用"}
                </p>
              </div>
            </div>
            <div className="summary-grid">
              <div className="summary-box">
                <strong>{user.score}</strong>
                <span>积分</span>
              </div>
              <div className="summary-box">
                <strong>{user._count.questions}</strong>
                <span>问题</span>
              </div>
              <div className="summary-box">
                <strong>{user._count.answers}</strong>
                <span>回答</span>
              </div>
              <div className="summary-box">
                <strong>{user._count.sessions}</strong>
                <span>会话</span>
              </div>
            </div>
          </section>

          <section className="panel pad">
            <h2 style={{ margin: "0 0 14px", fontSize: 18 }}>资料和权限</h2>
            <form className="form-grid" action={updateUserForAdminAction}>
              <input type="hidden" name="userId" value={user.id} />
              <div className="form-row">
                <label htmlFor="name">昵称</label>
                <input className="field" id="name" name="name" defaultValue={user.name} required minLength={2} maxLength={24} />
              </div>
              <div className="form-row">
                <label htmlFor="email">邮箱</label>
                <input className="field" id="email" name="email" type="email" defaultValue={user.email} required />
              </div>
              <div className="form-row">
                <label htmlFor="role">角色</label>
                <select className="select-box" id="role" name="role" defaultValue={user.role} disabled={editingSelf}>
                  <option value="USER">普通用户</option>
                  <option value="ADMIN">管理员</option>
                </select>
                {editingSelf ? (
                  <>
                    <input type="hidden" name="role" value="ADMIN" />
                    <p className="hint">不能移除自己的管理员身份。</p>
                  </>
                ) : null}
              </div>
              <div className="form-row">
                <label htmlFor="active">账号状态</label>
                <select className="select-box" id="active" name="active" defaultValue={user.isActive ? "true" : "false"} disabled={editingSelf}>
                  <option value="true">启用</option>
                  <option value="false">停用</option>
                </select>
                {editingSelf ? (
                  <>
                    <input type="hidden" name="active" value="true" />
                    <p className="hint">不能停用当前登录的管理员账号。</p>
                  </>
                ) : null}
              </div>
              <div className="button-row">
                <SubmitButton>保存资料</SubmitButton>
                <Link className="btn ghost" href="/admin/users">
                  返回列表
                </Link>
              </div>
            </form>
          </section>

          <section className="panel pad">
            <h2 style={{ margin: "0 0 14px", fontSize: 18 }}>重置密码</h2>
            <form className="form-grid" action={resetUserPasswordForAdminAction}>
              <input type="hidden" name="userId" value={user.id} />
              <div className="form-row">
                <label htmlFor="password">新密码</label>
                <input className="field" id="password" name="password" type="password" minLength={6} maxLength={128} required />
                <p className="hint">提交后会清理该用户所有现有会话，需要用新密码重新登录。</p>
              </div>
              <SubmitButton className="btn">重置密码</SubmitButton>
            </form>
          </section>
        </div>

        <aside className="side-stack">
          <section className="panel">
            <div className="panel-title">
              <div>
                <h2>近期问题</h2>
                <p>最近 {user.questions.length} 条。</p>
              </div>
            </div>
            <div className="preview-list">
              {user.questions.length ? (
                user.questions.map((question) => (
                  <Link className="preview-item" href={`/questions/${question.id}`} key={question.id}>
                    <strong>问</strong>
                    <span>
                      {question.title}
                      {question.hiddenAt ? " · 已隐藏" : ""}
                    </span>
                    <span className="score-pill">{question._count.answers} 答</span>
                  </Link>
                ))
              ) : (
                <div className="empty-state">暂无问题。</div>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">
              <div>
                <h2>近期回答</h2>
                <p>最近 {user.answers.length} 条。</p>
              </div>
            </div>
            <div className="preview-list">
              {user.answers.length ? (
                user.answers.map((answer) => (
                  <Link className="preview-item" href={`/questions/${answer.questionId}#answer-${answer.id}`} key={answer.id}>
                    <strong>答</strong>
                    <span>
                      {answer.question.title}
                      {answer.hiddenAt ? " · 已隐藏" : ""}
                    </span>
                    <span className="score-pill">{answer._count.votes} 赞</span>
                  </Link>
                ))
              ) : (
                <div className="empty-state">暂无回答。</div>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">
              <div>
                <h2>积分流水</h2>
                <p>最近 {user.scoreEvents.length} 条。</p>
              </div>
            </div>
            <div className="activity-list">
              {user.scoreEvents.length ? (
                user.scoreEvents.map((event) => (
                  <div className="activity-item" key={event.id}>
                    <span className={`avatar ${event.points > 0 ? "accent" : ""}`}>{event.points > 0 ? "+" : "-"}</span>
                    <div>
                      <strong>{eventTitle(event.type)}</strong>
                      <p>
                        {event.actor ? `操作人 ${event.actor.name} · ` : ""}
                        {formatRelativeTime(event.createdAt)}
                      </p>
                    </div>
                    <span className="score-pill">
                      {event.points > 0 ? "+" : ""}
                      {event.points}
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty-state">暂无积分流水。</div>
              )}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
