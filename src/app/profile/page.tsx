import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile, getCheckInStatus, getCheckInHistory, getFollowStats, isFollowing } from "@/lib/data";
import { formatRelativeTime, initials } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { ProfileSettings } from "./_components/profile-settings";
import { CheckInButton } from "@/components/checkin-button";
import { CheckInCalendar } from "@/components/checkin-calendar";
import { FollowButton } from "@/components/follow-button";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type TabType = "questions" | "answers" | "tags" | "score" | "checkin" | "settings";

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
    ANSWER_UNACCEPTED: "采纳被改选",
    DAILY_CHECK_IN: "每日签到",
    CONTINUOUS_CHECK_IN_BONUS: "连续签到奖励"
  };
  return titles[type] ?? "积分变化";
}

function tabHref(tab: TabType, userId?: string) {
  const params = new URLSearchParams();
  if (userId) params.set("userId", userId);
  if (tab !== "questions") params.set("tab", tab);
  const query = params.toString();
  return query ? `/profile?${query}` : "/profile";
}

export default async function ProfilePage({ searchParams }: PageProps) {
  const [user, raw] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) redirect("/auth");

  const userId = firstParam(raw.userId) ?? user.id;
  const isOwnProfile = userId === user.id;

  const [profile, checkInStatus, checkInHistory, followStats, userIsFollowing] = await Promise.all([
    getProfile(userId),
    isOwnProfile ? getCheckInStatus(user.id) : Promise.resolve({ hasCheckedInToday: false, continuousDays: 0, todayPoints: 0 }),
    isOwnProfile ? getCheckInHistory(user.id, 30) : Promise.resolve([]),
    getFollowStats(userId),
    isOwnProfile ? Promise.resolve(false) : isFollowing(user.id, userId)
  ]);
  if (!profile) redirect("/auth");

  const tab = (firstParam(raw.tab) ?? "questions") as TabType;
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
              <div className="follow-stats">
                <span>{followStats.followingCount} 关注</span>
                <span>{followStats.followersCount} 粉丝</span>
              </div>
            </div>
            <FollowButton
              targetUserId={userId}
              isFollowing={userIsFollowing}
              isOwnProfile={isOwnProfile}
            />
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
            <nav className="segmented">
              {(isOwnProfile
                ? (["questions", "answers", "tags", "score", "checkin", "settings"] as TabType[])
                : (["questions", "answers", "tags", "score"] as TabType[])
              ).map((item) => (
                <Link aria-current={tab === item} href={tabHref(item, isOwnProfile ? undefined : userId)} key={item}>
                  {item === "questions"
                    ? "问题"
                    : item === "answers"
                      ? "回答"
                      : item === "tags"
                        ? "标签"
                        : item === "score"
                          ? "积分"
                          : item === "checkin"
                            ? "签到"
                            : "设置"}
                </Link>
              ))}
            </nav>
          </div>

          {tab === "questions" && (
            <div className="content-list">
              {profile.questions.length ? (
                profile.questions.map((question) => (
                  <Link className="content-item" href={`/questions/${question.id}`} key={question.id}>
                    <div>
                      <strong>{question.title}</strong>
                      <p className="hint">{formatRelativeTime(question.createdAt)}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="empty-state">还没有发布问题。</div>
              )}
            </div>
          )}

          {tab === "answers" && (
            <div className="content-list">
              {profile.answers.length ? (
                profile.answers.map((answer) => (
                  <Link className="content-item" href={`/questions/${answer.questionId}`} key={answer.id}>
                    <div>
                      <strong>{answer.question.title}</strong>
                      <p className="hint">{formatRelativeTime(answer.createdAt)}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="empty-state">还没有提交回答。</div>
              )}
            </div>
          )}

          {tab === "tags" && (
            <div className="empty-state">标签功能开发中。</div>
          )}

          {tab === "score" && (
            <div className="activity-list">
              {profile.scoreEvents.length ? (
                profile.scoreEvents.map((event) => (
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
                <div className="empty-state">还没有积分记录。</div>
              )}
            </div>
          )}

          {tab === "checkin" && isOwnProfile && (
            <div className="checkin-section">
              <CheckInButton
                hasCheckedIn={checkInStatus.hasCheckedInToday}
                continuousDays={checkInStatus.continuousDays}
              />
              <CheckInCalendar checkIns={checkInHistory} />
            </div>
          )}

          {tab === "settings" && isOwnProfile && (
            <ProfileSettings user={{ id: user.id, name: profile.name, email: profile.email }} />
          )}
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
      </aside>
    </main>
  );
}
