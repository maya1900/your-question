import { ScoreEventType } from "@prisma/client";
import { scoreValues } from "@/lib/constants";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { addScoreEvent } from "@/lib/score";

export type BusinessStatus =
  | "created"
  | "voted"
  | "unvoted"
  | "accepted"
  | "already-accepted"
  | "updated"
  | "missing"
  | "conflict"
  | "self-vote"
  | "no-permission"
  | "inactive"
  | "already-checked-in";

async function isAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true }
  });
  return user?.role === "ADMIN" && user.isActive;
}

async function isActiveUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true }
  });
  return user?.isActive === true;
}

export async function createAnswerForUser({
  userId,
  questionId,
  summary,
  body
}: {
  userId: string;
  questionId: string;
  summary?: string | null;
  body: string;
}) {
  if (!(await isActiveUser(userId))) return { status: "inactive" as const };

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true, hiddenAt: true }
  });

  if (!question) return { status: "missing" as const };
  if (question.hiddenAt) return { status: "missing" as const };

  const answer = await prisma.$transaction(async (tx) => {
    const created = await tx.answer.create({
      data: {
        questionId: question.id,
        authorId: userId,
        summary: summary || null,
        body
      }
    });

    await addScoreEvent(tx, {
      userId,
      actorId: userId,
      type: ScoreEventType.ANSWER_CREATED,
      points: scoreValues.answerCreated,
      message: "提交回答",
      questionId: question.id,
      answerId: created.id
    });

    return created;
  });

  return { status: "created" as const, answer };
}

export async function toggleQuestionVoteForUser(userId: string, questionId: string) {
  if (!(await isActiveUser(userId))) return { status: "inactive" as const };

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true, authorId: true, hiddenAt: true }
  });

  if (!question) return { status: "missing" as const };
  if (question.hiddenAt) return { status: "missing" as const };
  if (question.authorId === userId) return { status: "self-vote" as const, questionId: question.id };

  const status = await prisma.$transaction(async (tx) => {
    const existing = await tx.vote.findUnique({
      where: {
        userId_questionId: {
          userId,
          questionId: question.id
        }
      }
    });

    if (existing) {
      await tx.vote.delete({ where: { id: existing.id } });
      await addScoreEvent(tx, {
        userId: question.authorId,
        actorId: userId,
        type: ScoreEventType.QUESTION_UNVOTED,
        points: -scoreValues.upvote,
        message: "问题点赞被取消",
        questionId: question.id
      });
      return "unvoted" as const;
    }

    await tx.vote.create({
      data: {
        userId,
        questionId: question.id
      }
    });
    await addScoreEvent(tx, {
      userId: question.authorId,
      actorId: userId,
      type: ScoreEventType.QUESTION_UPVOTED,
      points: scoreValues.upvote,
      message: "问题获得点赞",
      questionId: question.id
    });

    return "voted" as const;
  });

  return { status, questionId: question.id };
}

export async function toggleAnswerVoteForUser(userId: string, answerId: string) {
  if (!(await isActiveUser(userId))) return { status: "inactive" as const };

  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    select: { id: true, authorId: true, questionId: true, hiddenAt: true, question: { select: { hiddenAt: true } } }
  });

  if (!answer) return { status: "missing" as const };
  if (answer.hiddenAt || answer.question.hiddenAt) return { status: "missing" as const };
  if (answer.authorId === userId) return { status: "self-vote" as const, questionId: answer.questionId };

  const status = await prisma.$transaction(async (tx) => {
    const existing = await tx.vote.findUnique({
      where: {
        userId_answerId: {
          userId,
          answerId: answer.id
        }
      }
    });

    if (existing) {
      await tx.vote.delete({ where: { id: existing.id } });
      await addScoreEvent(tx, {
        userId: answer.authorId,
        actorId: userId,
        type: ScoreEventType.ANSWER_UNVOTED,
        points: -scoreValues.upvote,
        message: "回答点赞被取消",
        questionId: answer.questionId,
        answerId: answer.id
      });
      return "unvoted" as const;
    }

    await tx.vote.create({
      data: {
        userId,
        answerId: answer.id
      }
    });
    await addScoreEvent(tx, {
      userId: answer.authorId,
      actorId: userId,
      type: ScoreEventType.ANSWER_UPVOTED,
      points: scoreValues.upvote,
      message: "回答获得点赞",
      questionId: answer.questionId,
      answerId: answer.id
    });

    return "voted" as const;
  });

  return { status, questionId: answer.questionId };
}

export async function acceptAnswerForUser(userId: string, answerId: string) {
  if (!(await isActiveUser(userId))) return { status: "inactive" as const };

  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    include: {
      question: {
        include: {
          acceptedAnswer: true
        }
      }
    }
  });

  if (!answer) return { status: "missing" as const };
  if (answer.hiddenAt || answer.question.hiddenAt) return { status: "missing" as const };
  if (answer.question.authorId !== userId) {
    return { status: "no-permission" as const, questionId: answer.questionId };
  }

  const status = await prisma.$transaction(async (tx) => {
    if (answer.question.acceptedAnswerId === answer.id) return "already-accepted" as const;

    if (answer.question.acceptedAnswer) {
      await addScoreEvent(tx, {
        userId: answer.question.acceptedAnswer.authorId,
        actorId: userId,
        type: ScoreEventType.ANSWER_UNACCEPTED,
        points: -scoreValues.acceptedAnswer,
        message: "最佳答案被改选",
        questionId: answer.questionId,
        answerId: answer.question.acceptedAnswer.id
      });
    }

    await tx.question.update({
      where: { id: answer.questionId },
      data: {
        acceptedAnswerId: answer.id
      }
    });

    await addScoreEvent(tx, {
      userId: answer.authorId,
      actorId: userId,
      type: ScoreEventType.ANSWER_ACCEPTED,
      points: scoreValues.acceptedAnswer,
      message: "回答被采纳",
      questionId: answer.questionId,
      answerId: answer.id
    });

    return "accepted" as const;
  });

  return { status, questionId: answer.questionId };
}

export async function setUserActiveForAdmin(adminId: string, userId: string, active: boolean) {
  if (!(await isAdmin(adminId))) return { status: "no-permission" as const };
  if (adminId === userId && !active) return { status: "no-permission" as const };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });

  if (!user) return { status: "missing" as const };

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { isActive: active }
    });

    if (!active) {
      await tx.session.deleteMany({
        where: { userId: user.id }
      });
    }
  });

  return { status: "updated" as const };
}

export async function updateUserForAdmin({
  adminId,
  userId,
  name,
  email,
  role,
  active
}: {
  adminId: string;
  userId: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  active: boolean;
}) {
  if (!(await isAdmin(adminId))) return { status: "no-permission" as const };
  if (adminId === userId && (!active || role !== "ADMIN")) {
    return { status: "no-permission" as const };
  }

  const normalizedEmail = email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  if (!user) return { status: "missing" as const };

  const emailOwner = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true }
  });
  if (emailOwner && emailOwner.id !== user.id) return { status: "conflict" as const };

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        name,
        email: normalizedEmail,
        role,
        isActive: active
      }
    });

    if (!active) {
      await tx.session.deleteMany({
        where: { userId: user.id }
      });
    }
  });

  return { status: "updated" as const };
}

export async function resetUserPasswordForAdmin({
  adminId,
  userId,
  password
}: {
  adminId: string;
  userId: string;
  password: string;
}) {
  if (!(await isAdmin(adminId))) return { status: "no-permission" as const };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  if (!user) return { status: "missing" as const };

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(password)
      }
    });
    await tx.session.deleteMany({
      where: { userId: user.id }
    });
  });

  return { status: "updated" as const };
}

export async function setQuestionHiddenForAdmin(adminId: string, questionId: string, hidden: boolean) {
  if (!(await isAdmin(adminId))) return { status: "no-permission" as const };

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true }
  });

  if (!question) return { status: "missing" as const };

  await prisma.$transaction(async (tx) => {
    await tx.question.update({
      where: { id: question.id },
      data: { hiddenAt: hidden ? new Date() : null }
    });

    if (hidden) {
      await tx.vote.deleteMany({ where: { questionId: question.id } });
    }
  });

  return { status: "updated" as const };
}

export async function setAnswerHiddenForAdmin(adminId: string, answerId: string, hidden: boolean) {
  if (!(await isAdmin(adminId))) return { status: "no-permission" as const };

  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    select: { id: true, questionId: true, authorId: true }
  });

  if (!answer) return { status: "missing" as const };

  await prisma.$transaction(async (tx) => {
    if (hidden) {
      const acceptedQuestion = await tx.question.findFirst({
        where: { acceptedAnswerId: answer.id },
        select: { id: true }
      });

      if (acceptedQuestion) {
        await addScoreEvent(tx, {
          userId: answer.authorId,
          actorId: adminId,
          type: ScoreEventType.ANSWER_UNACCEPTED,
          points: -scoreValues.acceptedAnswer,
          message: "最佳答案被管理员隐藏",
          questionId: acceptedQuestion.id,
          answerId: answer.id
        });
      }

      await tx.question.updateMany({
        where: { acceptedAnswerId: answer.id },
        data: { acceptedAnswerId: null }
      });
      await tx.vote.deleteMany({ where: { answerId: answer.id } });
    }

    await tx.answer.update({
      where: { id: answer.id },
      data: { hiddenAt: hidden ? new Date() : null }
    });
  });

  return { status: "updated" as const, questionId: answer.questionId };
}

export async function deleteUserForAdmin(adminId: string, userId: string) {
  if (!(await isAdmin(adminId))) return { status: "no-permission" as const };
  if (adminId === userId) return { status: "no-permission" as const };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });

  if (!user) return { status: "missing" as const };

  await prisma.user.delete({
    where: { id: user.id }
  });

  return { status: "updated" as const };
}

export async function deleteQuestionForAdmin(adminId: string, questionId: string) {
  if (!(await isAdmin(adminId))) return { status: "no-permission" as const };

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      author: true,
      votes: true
    }
  });

  if (!question) return { status: "missing" as const };

  await prisma.$transaction(async (tx) => {
    // 扣除创建问题的积分
    await addScoreEvent(tx, {
      userId: question.authorId,
      actorId: adminId,
      type: ScoreEventType.QUESTION_CREATED,
      points: -scoreValues.questionCreated,
      message: "问题被管理员删除",
      questionId: question.id
    });

    // 扣除所有点赞的积分
    for (const vote of question.votes) {
      await addScoreEvent(tx, {
        userId: question.authorId,
        actorId: adminId,
        type: ScoreEventType.QUESTION_UNVOTED,
        points: -scoreValues.upvote,
        message: "问题被删除，点赞积分扣除",
        questionId: question.id
      });
    }

    // 删除问题（级联删除会处理相关的回答、投票等）
    await tx.question.delete({
      where: { id: question.id }
    });
  });

  return { status: "updated" as const };
}

export async function deleteAnswerForAdmin(adminId: string, answerId: string) {
  if (!(await isAdmin(adminId))) return { status: "no-permission" as const };

  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    include: {
      author: true,
      votes: true,
      question: {
        select: {
          id: true,
          acceptedAnswerId: true
        }
      }
    }
  });

  if (!answer) return { status: "missing" as const };

  await prisma.$transaction(async (tx) => {
    // 扣除创建回答的积分
    await addScoreEvent(tx, {
      userId: answer.authorId,
      actorId: adminId,
      type: ScoreEventType.ANSWER_CREATED,
      points: -scoreValues.answerCreated,
      message: "回答被管理员删除",
      questionId: answer.questionId,
      answerId: answer.id
    });

    // 如果是被采纳的回答，扣除采纳积分
    if (answer.question.acceptedAnswerId === answer.id) {
      await addScoreEvent(tx, {
        userId: answer.authorId,
        actorId: adminId,
        type: ScoreEventType.ANSWER_UNACCEPTED,
        points: -scoreValues.acceptedAnswer,
        message: "回答被删除，采纳积分扣除",
        questionId: answer.questionId,
        answerId: answer.id
      });

      // 清除问题的 acceptedAnswerId
      await tx.question.update({
        where: { id: answer.questionId },
        data: { acceptedAnswerId: null }
      });
    }

    // 扣除所有点赞的积分
    for (const vote of answer.votes) {
      await addScoreEvent(tx, {
        userId: answer.authorId,
        actorId: adminId,
        type: ScoreEventType.ANSWER_UNVOTED,
        points: -scoreValues.upvote,
        message: "回答被删除，点赞积分扣除",
        questionId: answer.questionId,
        answerId: answer.id
      });
    }

    // 删除回答
    await tx.answer.delete({
      where: { id: answer.id }
    });
  });

  return { status: "updated" as const, questionId: answer.questionId };
}

export async function deleteTagForAdmin(adminId: string, tagId: string) {
  if (!(await isAdmin(adminId))) return { status: "no-permission" as const };

  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
    select: { id: true }
  });

  if (!tag) return { status: "missing" as const };

  await prisma.tag.delete({
    where: { id: tag.id }
  });

  return { status: "updated" as const };
}

export async function checkInForUser(userId: string) {
  if (!(await isActiveUser(userId))) return { status: "inactive" as const };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 检查今天是否已签到
  const existingCheckIn = await prisma.checkIn.findFirst({
    where: {
      userId,
      checkInDate: {
        gte: today,
        lt: tomorrow
      }
    }
  });

  if (existingCheckIn) {
    return { status: "already-checked-in" as const };
  }

  // 获取昨天的签到记录
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayCheckIn = await prisma.checkIn.findFirst({
    where: {
      userId,
      checkInDate: {
        gte: yesterday,
        lt: today
      }
    },
    orderBy: { checkInDate: "desc" }
  });

  const continuousDays = yesterdayCheckIn ? yesterdayCheckIn.continuousDays + 1 : 1;
  const basePoints = scoreValues.dailyCheckIn;
  const bonusPoints = continuousDays >= 7 ? scoreValues.continuousCheckInBonus : 0;
  const totalPoints = basePoints + bonusPoints;

  const checkIn = await prisma.$transaction(async (tx) => {
    const created = await tx.checkIn.create({
      data: {
        userId,
        checkInDate: today,
        points: totalPoints,
        continuousDays
      }
    });

    await addScoreEvent(tx, {
      userId,
      actorId: userId,
      type: ScoreEventType.DAILY_CHECK_IN,
      points: basePoints,
      message: `每日签到（连续${continuousDays}天）`
    });

    if (bonusPoints > 0) {
      await addScoreEvent(tx, {
        userId,
        actorId: userId,
        type: ScoreEventType.CONTINUOUS_CHECK_IN_BONUS,
        points: bonusPoints,
        message: `连续签到${continuousDays}天奖励`
      });
    }

    return created;
  });

  return {
    status: "created" as const,
    checkIn,
    continuousDays,
    totalPoints
  };
}
