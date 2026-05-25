import { z } from "zod";

export const authSchema = z.object({
  email: z.string().trim().email("请输入有效邮箱。"),
  password: z.string().min(6, "密码至少 6 位。")
});

export const registerSchema = authSchema.extend({
  name: z.string().trim().min(2, "昵称至少 2 个字。").max(24, "昵称最多 24 个字。")
});

export const adminUserSchema = z.object({
  userId: z.string().min(1, "用户不存在。"),
  name: z.string().trim().min(2, "昵称至少 2 个字。").max(24, "昵称最多 24 个字。"),
  email: z.string().trim().email("请输入有效邮箱。"),
  role: z.enum(["USER", "ADMIN"]),
  active: z.enum(["true", "false"])
});

export const adminPasswordResetSchema = z.object({
  userId: z.string().min(1, "用户不存在。"),
  password: z.string().min(6, "密码至少 6 位。").max(128, "密码最多 128 位。")
});

export const questionSchema = z.object({
  title: z.string().trim().min(5, "标题至少 5 个字。").max(120, "标题最多 120 个字。"),
  body: z.string().trim().min(10, "问题描述至少 10 个字。").max(5000, "问题描述最多 5000 个字。"),
  details: z.string().trim().max(3000, "补充信息最多 3000 个字。").optional(),
  tags: z.string().trim().min(1, "至少填写一个标签。")
});

export const answerSchema = z.object({
  questionId: z.string().min(1),
  summary: z.string().trim().max(120, "回答摘要最多 120 个字。").optional(),
  body: z.string().trim().min(10, "回答内容至少 10 个字。").max(5000, "回答内容最多 5000 个字。")
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "昵称至少 2 个字。").max(24, "昵称最多 24 个字。"),
  email: z.string().trim().email("请输入有效邮箱。")
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "请输入当前密码。"),
  newPassword: z.string().min(6, "新密码至少 6 位。").max(128, "新密码最多 128 位。"),
  confirmPassword: z.string().min(1, "请确认新密码。")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "两次输入的密码不一致。",
  path: ["confirmPassword"]
});

export function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
