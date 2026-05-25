import { ThumbsUp } from "lucide-react";
import { toggleAnswerVoteAction, toggleQuestionVoteAction } from "@/app/actions";

export function QuestionVoteForm({
  questionId,
  count,
  active,
  disabled
}: {
  questionId: string;
  count: number;
  active: boolean;
  disabled?: boolean;
}) {
  return (
    <form action={toggleQuestionVoteAction}>
      <input type="hidden" name="questionId" value={questionId} />
      <button className="vote-button" type="submit" aria-pressed={active} disabled={disabled}>
        <ThumbsUp size={14} aria-hidden="true" /> 赞同 {count}
      </button>
    </form>
  );
}

export function AnswerVoteForm({
  answerId,
  count,
  active,
  disabled
}: {
  answerId: string;
  count: number;
  active: boolean;
  disabled?: boolean;
}) {
  return (
    <form action={toggleAnswerVoteAction}>
      <input type="hidden" name="answerId" value={answerId} />
      <button className="vote-button" type="submit" aria-pressed={active} disabled={disabled}>
        <ThumbsUp size={14} aria-hidden="true" /> 赞同 {count}
      </button>
    </form>
  );
}
