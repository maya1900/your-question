"use client";

import { useActionState, useState } from "react";
import { createQuestionAction } from "@/app/actions";
import { scoreValues } from "@/lib/constants";
import { SubmitButton } from "@/components/submit-button";
import { RichTextEditor } from "@/components/rich-text-editor";

export function QuestionForm() {
  const [state, formAction] = useActionState(createQuestionAction, {});
  const [tags, setTags] = useState("");
  const [body, setBody] = useState("");
  const [details, setDetails] = useState("");

  return (
    <form className="form-grid" action={formAction}>
      {state.message ? (
        <p className={state.ok ? "notice" : "form-alert"}>{state.message}</p>
      ) : null}
      <div className="form-row">
        <label htmlFor="ask-title">问题标题</label>
        <input
          className="field"
          id="ask-title"
          name="title"
          placeholder="比如：租房潮湿时怎么防霉更有效？"
          minLength={5}
          maxLength={120}
          required
        />
        <p className="hint">尽量包含场景和目标，至少 5 个字。</p>
      </div>
      <div className="form-row">
        <label htmlFor="ask-tags">标签</label>
        <input
          className="field"
          id="ask-tags"
          name="tags"
          placeholder="生活, 居家, 租房"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          required
        />
        <p className="hint">至少选择 1 个标签，用逗号分隔。</p>
      </div>
      <div className="form-row">
        <label htmlFor="ask-body">问题描述</label>
        <input type="hidden" name="body" value={body} />
        <RichTextEditor
          content={body}
          onChange={setBody}
          placeholder="描述背景、尝试过的方法、卡住的地方。"
        />
        <p className="hint">建议说明背景、尝试过什么、你想得到什么答案。</p>
      </div>
      <div className="form-row">
        <label htmlFor="ask-details">补充信息</label>
        <input type="hidden" name="details" value={details} />
        <RichTextEditor
          content={details}
          onChange={setDetails}
          placeholder="例如预算、时间限制、地区、设备条件等。"
        />
      </div>
      <div className="button-row">
        <SubmitButton>发布问题</SubmitButton>
        <span className="hint">
          发布问题可获得 <strong>{scoreValues.questionCreated}</strong> 积分。
        </span>
      </div>
    </form>
  );
}
