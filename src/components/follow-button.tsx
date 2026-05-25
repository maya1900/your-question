"use client";

import { useActionState } from "react";
import { toggleFollowAction } from "@/app/actions";

type FollowButtonProps = {
  targetUserId: string;
  isFollowing: boolean;
  isOwnProfile: boolean;
};

export function FollowButton({ targetUserId, isFollowing, isOwnProfile }: FollowButtonProps) {
  const [state, action, pending] = useActionState(
    async () => toggleFollowAction(targetUserId),
    {}
  );

  if (isOwnProfile) return null;

  return (
    <form action={action}>
      <button
        className={`btn ${isFollowing ? "ghost" : "primary"}`}
        disabled={pending}
        type="submit"
      >
        {pending ? "处理中..." : isFollowing ? "取消关注" : "关注"}
      </button>
      {state.message && (
        <div className={`notice ${state.ok ? "success" : "error"}`}>
          {state.message}
        </div>
      )}
    </form>
  );
}
