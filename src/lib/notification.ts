import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type CreateNotificationParams = {
  userId: string;
  actorId: string | null;
  type: NotificationType;
  message: string;
  questionId?: string;
  answerId?: string;
};

export async function createNotification(
  tx: Prisma.TransactionClient,
  params: CreateNotificationParams
) {
  // 不给自己发通知
  if (params.userId === params.actorId) return;

  return tx.notification.create({
    data: {
      userId: params.userId,
      actorId: params.actorId,
      type: params.type,
      message: params.message,
      questionId: params.questionId,
      answerId: params.answerId
    }
  });
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId
    },
    data: {
      isRead: true
    }
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: {
      isRead: true
    }
  });
}
