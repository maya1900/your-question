"use client";

import { useActionState, useState } from "react";
import { loginAction, registerAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";

export function AuthForms() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginState, loginFormAction] = useActionState(loginAction, {});
  const [registerState, registerFormAction] = useActionState(registerAction, {});

  return (
    <div className="auth-card">
      <div className="segmented" style={{ marginBottom: 18 }}>
        <button
          type="button"
          aria-pressed={mode === "login"}
          onClick={() => setMode("login")}
        >
          登录
        </button>
        <button
          type="button"
          aria-pressed={mode === "register"}
          onClick={() => setMode("register")}
        >
          注册
        </button>
      </div>

      {mode === "login" ? (
        <form className="form-grid" action={loginFormAction}>
          {loginState.message ? <p className="form-alert">{loginState.message}</p> : null}
          <div className="form-row">
            <label htmlFor="login-email">邮箱</label>
            <input
              className="field"
              id="login-email"
              name="email"
              type="email"
              placeholder="name@example.com"
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="login-password">密码</label>
            <input
              className="field"
              id="login-password"
              name="password"
              type="password"
              placeholder="至少 6 位"
              minLength={6}
              required
            />
          </div>
          <div className="button-row">
            <SubmitButton>登录</SubmitButton>
            <span className="hint">登录后可以发布问题、回答和点赞。</span>
          </div>
        </form>
      ) : (
        <form className="form-grid" action={registerFormAction}>
          {registerState.message ? <p className="form-alert">{registerState.message}</p> : null}
          <div className="form-row">
            <label htmlFor="register-name">昵称</label>
            <input
              className="field"
              id="register-name"
              name="name"
              type="text"
              placeholder="给自己取个好记的名字"
              minLength={2}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="register-email">邮箱</label>
            <input
              className="field"
              id="register-email"
              name="email"
              type="email"
              placeholder="name@example.com"
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="register-password">密码</label>
            <input
              className="field"
              id="register-password"
              name="password"
              type="password"
              placeholder="至少 6 位"
              minLength={6}
              required
            />
          </div>
          <div className="button-row">
            <SubmitButton>注册</SubmitButton>
            <span className="hint">注册后即可参与社区贡献。</span>
          </div>
        </form>
      )}
    </div>
  );
}
