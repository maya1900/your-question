import { AuthForms } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AuthPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main className="auth-shell">
      <section className="auth-grid">
        <div className="auth-copy">
          <h1>欢迎回来，继续提问或回答。</h1>
          <p>登录后可以发布问题、点赞回答、采纳最佳答案，并跟踪自己的积分和贡献记录。</p>
        </div>
        <AuthForms />
      </section>
    </main>
  );
}
