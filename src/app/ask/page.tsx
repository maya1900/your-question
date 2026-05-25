import { redirect } from "next/navigation";
import { QuestionForm } from "@/components/question-form";
import { scoreValues } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";

export default async function AskPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  return (
    <main className="page-shell ask-layout">
      <section className="panel pad">
        <div className="page-title">
          <h1>发布问题</h1>
          <p>写清楚场景、已有尝试和期望结果，答案会更准确，积分也更容易拿到。</p>
        </div>
        <QuestionForm />
      </section>

      <aside className="side-stack">
        <section className="preview-card">
          <h3>提问建议</h3>
          <p>说清楚你已经尝试过什么，答案会更快聚焦。</p>
          <div className="preview-list">
            <div className="preview-item">
              <strong>场景</strong>
              <span>生活、学习、工作、消费</span>
            </div>
            <div className="preview-item">
              <strong>结果</strong>
              <span>想要一个具体可执行的方法</span>
            </div>
            <div className="preview-item">
              <strong>状态</strong>
              <span>标题、正文、标签都通过后再提交</span>
            </div>
          </div>
        </section>
        <section className="summary-card">
          <h3>积分说明</h3>
          <div className="summary-grid">
            <div className="summary-box">
              <strong>+{scoreValues.questionCreated}</strong>
              <span>发布问题</span>
            </div>
            <div className="summary-box">
              <strong>+{scoreValues.upvote}</strong>
              <span>内容被点赞</span>
            </div>
            <div className="summary-box">
              <strong>+{scoreValues.acceptedAnswer}</strong>
              <span>回答被采纳</span>
            </div>
            <div className="summary-box">
              <strong>+{scoreValues.answerCreated}</strong>
              <span>提交回答</span>
            </div>
          </div>
        </section>
      </aside>
    </main>
  );
}
