"use client";

import { useActionState } from "react";
import { checkInAction } from "@/app/actions";

type CheckInButtonProps = {
  hasCheckedIn: boolean;
  continuousDays: number;
};

export function CheckInButton({ hasCheckedIn, continuousDays }: CheckInButtonProps) {
  const [state, action, pending] = useActionState(checkInAction, {});

  return (
    <div className="checkin-card">
      <div className="checkin-info">
        <h3>每日签到</h3>
        <p className="checkin-streak">
          {hasCheckedIn ? (
            <>已签到 · 连续 {continuousDays} 天</>
          ) : (
            <>连续签到 {continuousDays} 天</>
          )}
        </p>
        <p className="hint">每日签到获得 5 积分，连续签到 7 天额外奖励 3 积分</p>
      </div>
      <form action={action}>
        <button
          className="btn primary"
          disabled={hasCheckedIn || pending}
          type="submit"
        >
          {pending ? "签到中..." : hasCheckedIn ? "今日已签到" : "立即签到"}
        </button>
      </form>
      {state.message && (
        <div className={`notice ${state.ok ? "success" : "error"}`}>
          {state.message}
        </div>
      )}
    </div>
  );
}
