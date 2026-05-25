"use client";

import { useActionState } from "react";
import { createAnswerAction } from "@/app/actions";
import { scoreValues } from "@/lib/constants";
import { SubmitButton } from "@/components/submit-button";

export function AnswerForm({ questionId }: { questionId: string }) {
  const [state, formAction] = useActionState(createAnswerAction, {});

  return (
    <form className="form-grid" action={formAction}>
      {state.message ? (
        <p className={state.ok ? "notice" : "form-alert"}>{state.message}</p>
      ) : null}
      <input type="hidden" name="questionId" value={questionId} />
      <div className="form-row">
        <label htmlFor="answer-summary">回答摘要</label>
        <input
          className="field"
          id="answer-summary"
          name="summary"
          placeholder="比如：先控湿，再收纳，再通风"
          maxLength={120}
        />
      </div>
      <div className="form-row">
        <label htmlFor="answer-body">回答内容</label>
        <textarea
          className="field"
          id="answer-body"
          name="body"
          placeholder="写清楚步骤、限制和适用场景。"
          minLength={10}
          required
        />
        <p className="hint">有效回答可获得 {scoreValues.answerCreated} 积分。</p>
      </div>
      <div className="button-row">
        <SubmitButton>提交回答</SubmitButton>
      </div>
    </form>
  );
}
