"use client";

import { useActionState } from "react";
import { updateProfileAction, changePasswordAction } from "@/app/actions";

type User = {
  id: string;
  name: string;
  email: string;
};

export function ProfileSettings({ user }: { user: User }) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfileAction, {});
  const [passwordState, passwordAction, passwordPending] = useActionState(changePasswordAction, {});

  return (
    <div className="settings-container">
      <section className="settings-section">
        <h3>个人资料</h3>
        <form action={profileAction} className="form-stack">
          <div className="form-field">
            <label htmlFor="name">昵称</label>
            <input
              defaultValue={user.name}
              id="name"
              name="name"
              required
              type="text"
            />
          </div>
          <div className="form-field">
            <label htmlFor="email">邮箱</label>
            <input
              defaultValue={user.email}
              id="email"
              name="email"
              required
              type="email"
            />
          </div>
          {profileState.message && (
            <div className={`notice ${profileState.ok ? "success" : "error"}`}>
              {profileState.message}
            </div>
          )}
          <button className="btn primary" disabled={profilePending} type="submit">
            {profilePending ? "保存中..." : "保存资料"}
          </button>
        </form>
      </section>

      <section className="settings-section">
        <h3>修改密码</h3>
        <form action={passwordAction} className="form-stack">
          <div className="form-field">
            <label htmlFor="currentPassword">当前密码</label>
            <input
              id="currentPassword"
              name="currentPassword"
              required
              type="password"
            />
          </div>
          <div className="form-field">
            <label htmlFor="newPassword">新密码</label>
            <input
              id="newPassword"
              name="newPassword"
              required
              type="password"
            />
          </div>
          <div className="form-field">
            <label htmlFor="confirmPassword">确认新密码</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              required
              type="password"
            />
          </div>
          {passwordState.message && (
            <div className={`notice ${passwordState.ok ? "success" : "error"}`}>
              {passwordState.message}
            </div>
          )}
          <button className="btn primary" disabled={passwordPending} type="submit">
            {passwordPending ? "修改中..." : "修改密码"}
          </button>
        </form>
      </section>
    </div>
  );
}
