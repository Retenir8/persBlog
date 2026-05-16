"use client";

import Link from "next/link";
import { useState } from "react";
import type { RelationStatus } from "@/lib/services/followService";
import RelationButton from "@/components/social/RelationButton";
import { pagePrimaryCtaClassName } from "@/lib/surfaceStyles";

export function ProfileVisitorActions({
  targetUserId,
  initialStatus,
}: {
  targetUserId: string;
  initialStatus: RelationStatus;
}) {
  const [status, setStatus] = useState<RelationStatus>(initialStatus);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <RelationButton
        targetUserId={targetUserId}
        initialStatus={status}
        onStatusChange={setStatus}
      />
      {status === "mutual" ? (
        <Link
          href="/messages"
          className={`${pagePrimaryCtaClassName} px-4 py-2 text-sm`}
        >
          发私信
        </Link>
      ) : (
        <span className="text-xs text-zinc-500">互相关注后可发私信</span>
      )}
    </div>
  );
}
