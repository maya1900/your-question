export const SESSION_COOKIE = "zhanwen_session";

export const scoreValues = {
  questionCreated: 10,
  answerCreated: 15,
  acceptedAnswer: 25,
  upvote: 2,
  dailyCheckIn: 5,
  continuousCheckInBonus: 3
} as const;

export const tagOptions = [
  { label: "生活", slug: "life" },
  { label: "学习", slug: "study" },
  { label: "职场", slug: "work" },
  { label: "消费", slug: "buying" },
  { label: "城市", slug: "city" },
  { label: "健康", slug: "health" }
] as const;
