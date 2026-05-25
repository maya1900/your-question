"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { scoreValues } from "@/lib/constants";
import {
  resetUserPasswordForAdmin,
  setAnswerHiddenForAdmin,
  setQuestionHiddenForAdmin,
  setUserActiveForAdmin,
  updateUserForAdmin,
  acceptAnswerForUser,
  createAnswerForUser,
  toggleAnswerVoteForUser,
  toggleQuestionVoteForUser
} from "@/lib/business";
import { normalizeTags } from "@/lib/data";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { addScoreEvent } from "@/lib/score";
import { clearSession, createSession, getCurrentUser } from "@/lib/session";
import {
  adminPasswordResetSchema,
  adminUserSchema,
  answerSchema,
  authSchema,
  formString,
  questionSchema,
  registerSchema
} from "@/lib/validation";

export type ActionState = {
  ok?: boolean;
  message?: string;
};

function fail(message: string): ActionState {
  return { ok: false, message };
}

function success(message: string): ActionState {
  return { ok: true, message };
}

function safeAdminRedirectPath(value: string, fallback: string) {
  if (!value.startsWith("/admin")) return fallback;
  if (value.startsWith("//")) return fallback;
  return value;
}

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth");
  }
  if (!user.isActive) {
    await clearSession();
    redirect("/auth");
  }
  return user;
}

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/");
  }
  return user;
}

export async function loginAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = authSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password")
  });

  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "登录信息不完整。");

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() }
  });

  if (!user) return fail("邮箱或密码不正确。");
  if (!user.isActive) return fail("账号已被停用，请联系管理员。");

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return fail("邮箱或密码不正确。");

  await createSession(user.id);
  revalidatePath("/");
  redirect("/");
}

export async function registerAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formString(formData, "name"),
    email: formString(formData, "email"),
    password: formString(formData, "password")
  });

  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "注册信息不完整。");

  const email = parsed.data.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return fail("这个邮箱已经注册过。");

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash: await hashPassword(parsed.data.password)
    }
  });

  await createSession(user.id);
  revalidatePath("/");
  redirect("/");
}

export async function logoutAction() {
  await clearSession();
  revalidatePath("/");
  redirect("/");
}

export async function createQuestionAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = questionSchema.safeParse({
    title: formString(formData, "title"),
    body: formString(formData, "body"),
    details: formString(formData, "details"),
    tags: formString(formData, "tags")
  });

  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "问题还没写清楚。");

  const tags = normalizeTags(parsed.data.tags);
  if (!tags.length) return fail("至少填写一个标签。");

  const question = await prisma.$transaction(async (tx) => {
    const created = await tx.question.create({
      data: {
        title: parsed.data.title,
        body: parsed.data.body,
        details: parsed.data.details || null,
        authorId: user.id
      }
    });

    for (const tag of tags) {
      const savedTag = await tx.tag.upsert({
        where: { slug: tag.slug },
        update: { name: tag.name },
        create: tag
      });
      await tx.questionTag.create({
        data: {
          questionId: created.id,
          tagId: savedTag.id
        }
      });
    }

    await addScoreEvent(tx, {
      userId: user.id,
      actorId: user.id,
      type: "QUESTION_CREATED",
      points: scoreValues.questionCreated,
      message: "发布问题",
      questionId: created.id
    });

    return created;
  });

  revalidatePath("/");
  revalidatePath("/tags");
  redirect(`/questions/${question.id}`);
}

export async function createAnswerAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = answerSchema.safeParse({
    questionId: formString(formData, "questionId"),
    summary: formString(formData, "summary"),
    body: formString(formData, "body")
  });

  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "回答还没写清楚。");

  const result = await createAnswerForUser({
    userId: user.id,
    questionId: parsed.data.questionId,
    summary: parsed.data.summary,
    body: parsed.data.body
  });
  if (result.status === "missing") return fail("问题不存在。");

  revalidatePath("/");
  revalidatePath(`/questions/${parsed.data.questionId}`);
  return success(`回答已提交，积分 +${scoreValues.answerCreated}。`);
}

export async function toggleQuestionVoteAction(formData: FormData) {
  const user = await requireUser();
  const questionId = formString(formData, "questionId");
  const result = await toggleQuestionVoteForUser(user.id, questionId);

  if (result.status === "missing") return;
  if (result.status === "self-vote") redirect(`/questions/${result.questionId}?notice=self-vote`);

  revalidatePath("/");
  revalidatePath(`/questions/${result.questionId}`);
}

export async function toggleAnswerVoteAction(formData: FormData) {
  const user = await requireUser();
  const answerId = formString(formData, "answerId");
  const result = await toggleAnswerVoteForUser(user.id, answerId);

  if (result.status === "missing") return;
  if (result.status === "self-vote") redirect(`/questions/${result.questionId}?notice=self-vote`);

  revalidatePath("/");
  revalidatePath(`/questions/${result.questionId}`);
}

export async function acceptAnswerAction(formData: FormData) {
  const user = await requireUser();
  const answerId = formString(formData, "answerId");
  const result = await acceptAnswerForUser(user.id, answerId);

  if (result.status === "missing") return;
  if (result.status === "no-permission") redirect(`/questions/${result.questionId}?notice=no-permission`);

  revalidatePath("/");
  revalidatePath(`/questions/${result.questionId}`);
}

export async function setUserActiveAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = formString(formData, "userId");
  const active = formString(formData, "active") === "true";
  const redirectTo = safeAdminRedirectPath(formString(formData, "redirectTo"), "/admin");

  await setUserActiveForAdmin(admin.id, userId, active);
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  redirect(redirectTo);
}

export async function updateUserForAdminAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = adminUserSchema.safeParse({
    userId: formString(formData, "userId"),
    name: formString(formData, "name"),
    email: formString(formData, "email"),
    role: formString(formData, "role"),
    active: formString(formData, "active")
  });

  if (!parsed.success) {
    redirect(`/admin/users?notice=invalid-user-form`);
  }

  const result = await updateUserForAdmin({
    adminId: admin.id,
    userId: parsed.data.userId,
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role,
    active: parsed.data.active === "true"
  });

  if (result.status === "conflict") {
    redirect(`/admin/users/${parsed.data.userId}?notice=email-conflict`);
  }
  if (result.status === "no-permission") {
    redirect(`/admin/users/${parsed.data.userId}?notice=no-permission`);
  }
  if (result.status === "missing") {
    redirect("/admin/users?notice=user-missing");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${parsed.data.userId}`);
  redirect(`/admin/users/${parsed.data.userId}?notice=user-updated`);
}

export async function resetUserPasswordForAdminAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = adminPasswordResetSchema.safeParse({
    userId: formString(formData, "userId"),
    password: formString(formData, "password")
  });

  if (!parsed.success) {
    redirect("/admin/users?notice=invalid-password-form");
  }

  const result = await resetUserPasswordForAdmin({
    adminId: admin.id,
    userId: parsed.data.userId,
    password: parsed.data.password
  });

  if (result.status === "no-permission") {
    redirect(`/admin/users/${parsed.data.userId}?notice=no-permission`);
  }
  if (result.status === "missing") {
    redirect("/admin/users?notice=user-missing");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${parsed.data.userId}`);
  redirect(`/admin/users/${parsed.data.userId}?notice=password-reset`);
}

export async function setQuestionHiddenAction(formData: FormData) {
  const admin = await requireAdmin();
  const questionId = formString(formData, "questionId");
  const hidden = formString(formData, "hidden") === "true";
  const redirectTo = safeAdminRedirectPath(formString(formData, "redirectTo"), "/admin");

  await setQuestionHiddenForAdmin(admin.id, questionId, hidden);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/questions");
  revalidatePath(`/questions/${questionId}`);
  redirect(redirectTo);
}

export async function setAnswerHiddenAction(formData: FormData) {
  const admin = await requireAdmin();
  const answerId = formString(formData, "answerId");
  const questionId = formString(formData, "questionId");
  const hidden = formString(formData, "hidden") === "true";
  const redirectTo = safeAdminRedirectPath(formString(formData, "redirectTo"), "/admin");

  await setAnswerHiddenForAdmin(admin.id, answerId, hidden);
  revalidatePath("/admin");
  revalidatePath("/admin/answers");
  if (questionId) revalidatePath(`/questions/${questionId}`);
  redirect(redirectTo);
}
