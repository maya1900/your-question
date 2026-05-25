import type { Prisma, PrismaClient, ScoreEventType } from "@prisma/client";

type Tx = Prisma.TransactionClient | PrismaClient;

type ScoreInput = {
  userId: string;
  actorId?: string | null;
  type: ScoreEventType;
  points: number;
  message: string;
  questionId?: string | null;
  answerId?: string | null;
};

export async function addScoreEvent(tx: Tx, input: ScoreInput) {
  await tx.scoreEvent.create({
    data: {
      userId: input.userId,
      actorId: input.actorId ?? null,
      type: input.type,
      points: input.points,
      message: input.message,
      questionId: input.questionId ?? null,
      answerId: input.answerId ?? null
    }
  });

  await tx.user.update({
    where: { id: input.userId },
    data: {
      score: {
        increment: input.points
      }
    }
  });
}
