import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/data";
import { formatRelativeTime, initials } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function eventKind(type: string) {
  if (type === "QUESTION_CREATED") return "question";
  if (type === "ANSWER_CREATED") return "answer";
  if (type === "ANSWER_ACCEPTED" || type === "ANSWER_UNACCEPTED") return "accept";
  return "vote";
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

function filterHref(kind: string) {
  return kind === "all" ? "/profile" : `/profile?kind=${kind}`;
}

export default async function ProfilePage({ searchParams }: PageProps) {
  const [user, raw] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) redirect("/auth");

  const profile = await getProfile(user.id);
  if (!profile) redirect("/auth");

  const kind = firstParam(raw.kind) ?? "all";
  const events =
    kind === "all"
      ? profile.scoreEvents
      : profile.scoreEvents.filter((event) => eventKind(event.type) === kind);
  const level = Math.max(1, Math.floor(profile.score / 160) + 1);
  const currentLevelBase = (level - 1) * 160;
  const nextLevelBase = level * 160;
  const progress = Math.min(100, Math.round(((profile.score - currentLevelBase) / 160) * 100));
  const remaining = Math.max(0, nextLevelBase - profile.score);

  const breakdown = profile.scoreEvents.reduce(
    (acc, event) => {
      if (eventKind(event.type) === "question") acc.question += event.points;
      if (eventKind(event.type) === "answer") acc.answer += event.points;
      if (eventKind(event.type) === "accept") acc.accept += event.points;
      if (eventKind(event.type) === "vote") acc.vote += event.points;
      return acc;
    },
    { question: 0, answer: 0, accept: 0, vote: 0 }
  );

  return (
    <main className="page-shell profile-layout">
      <section className="page-grid">
        <div className="panel profile-head">
          <div className="profile-id">
            <span className="avatar accent">{initials(profile.name)}</span>
            <div>
              <h1>{profile.name}</h1>
              <p className="hint">近期累计获得 {profile.score} 积分。</p>
            </div>
          </div>
          <div className="profile-card">
            <div className="rank-row">
              <strong>成长进度</strong>
              <span className="score-pill">等级 {level}</span>
            </div>
            <div className="level-track">
              <div className="progress">
                <span style={{ width: `${Math.max(6, progress)}%` }} />
              </div>
              <p>距离下一级还差 {remaining} 分。</p>
            </div>
          </div>
        </div>

        <section className="panel">
          <div className="panel-title">
            <div>
              <h2>贡献动态</h2>
              <p>最近的问答、采纳和点赞记录。</p>
            </div>
            <div className="segmented">
              {["all", "question", "answer", "accept", "vote"].map((item) => (
                <Link aria-current={kind === item} href={filterHref(item)} key={item}>
                  {item === "all"
                    ? "全部"
                    : item === "question"
                      ? "提问"
                      : item === "answer"
                        ? "回答"
                        : item === "accept"
                          ? "采纳"
                          : "点赞"}
                </Link>
              ))}
            </div>
          </div>
          <div className="activity-list">
            {events.length ? (
              events.map((event) => (
                <div className="activity-item" key={event.id}>
                  <span className={`avatar ${event.points > 0 ? "accent" : ""}`}>{event.points > 0 ? "+" : "-"}</span>
                  <div>
                    <strong>{eventTitle(event.type)}</strong>
                    <p>
                      {event.question?.title ??
                        event.answer?.question.title ??
                        event.message}{" "}
                      · {formatRelativeTime(event.createdAt)}
                    </p>
                  </div>
                  <span className="score-pill">
                    {event.points > 0 ? "+" : ""}
                    {event.points}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state">这个分类还没有动态。</div>
            )}
          </div>
        </section>
      </section>

      <aside className="side-stack">
        <section className="summary-card">
          <h3>积分拆分</h3>
          <div className="summary-grid">
            <div className="summary-box">
              <strong>{breakdown.answer}</strong>
              <span>回答积分</span>
            </div>
            <div className="summary-box">
              <strong>{breakdown.accept}</strong>
              <span>采纳积分</span>
            </div>
            <div className="summary-box">
              <strong>{breakdown.question}</strong>
              <span>提问积分</span>
            </div>
            <div className="summary-box">
              <strong>{breakdown.vote}</strong>
              <span>点赞积分</span>
            </div>
          </div>
        </section>
        <section className="profile-card">
          <h3>近期内容</h3>
          <div className="preview-list">
            {profile.questions.slice(0, 3).map((question) => (
              <Link className="preview-item" href={`/questions/${question.id}`} key={question.id}>
                <strong>问</strong>
                <span>{question.title}</span>
                <span />
              </Link>
            ))}
            {profile.answers.slice(0, 2).map((answer) => (
              <Link className="preview-item" href={`/questions/${answer.questionId}`} key={answer.id}>
                <strong>答</strong>
                <span>{answer.question.title}</span>
                <span />
              </Link>
            ))}
          </div>
        </section>
      </aside>
    </main>
  );
}
