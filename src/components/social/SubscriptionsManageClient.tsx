"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import RelationButton from "@/components/social/RelationButton";
import type { RelationStatus } from "@/lib/services/followService";
import {
  pagePrimaryCtaClassName,
  paneEmptyClass,
  paneEmptyDescClass,
  paneEmptyTitleClass,
  socialSectionTitleClass,
  socialUserCardClass,
  surfacePanelClass,
} from "@/lib/surfaceStyles";

type UserCard = {
  id: string;
  name: string | null;
  avatar: string | null;
  initialStatus: RelationStatus;
};

function PaneEmpty({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={paneEmptyClass}>
      {icon}
      <h3 className={paneEmptyTitleClass}>{title}</h3>
      <p className={paneEmptyDescClass}>{description}</p>
      {action}
    </div>
  );
}

export function SubscriptionsManageClient({
  pendingFollowers,
  followings,
}: {
  pendingFollowers: UserCard[];
  followings: UserCard[];
}) {
  return (
    <div className="space-y-6">
      {pendingFollowers.length > 0 && (
        <section className={`p-5 sm:p-6 ${surfacePanelClass}`}>
          <h2 className={`mb-1 ${socialSectionTitleClass}`}>关注我的</h2>
          <p className={`mb-4 ${paneEmptyDescClass}`}>
            回关对方即可成为互关好友，之后可以发私信
          </p>
          <UserGrid users={pendingFollowers} />
        </section>
      )}

      <section className={`p-5 sm:p-6 ${surfacePanelClass}`}>
        <h2 className={`mb-4 ${socialSectionTitleClass}`}>我的订阅</h2>
        {followings.length === 0 ? (
          <PaneEmpty
            icon={<div className="text-6xl">📚</div>}
            title="还没有订阅任何用户"
            description="浏览文章并访问作者主页，点击「关注」即可订阅"
            action={
              <Link href="/posts" className={pagePrimaryCtaClassName}>
                浏览文章
              </Link>
            }
          />
        ) : (
          <UserGrid users={followings} />
        )}
      </section>
    </div>
  );
}

function UserGrid({ users }: { users: UserCard[] }) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {users.map((user) => (
        <li key={user.id} className={socialUserCardClass}>
          <div className="flex items-center gap-3">
            <Link href={`/users/${user.id}`} className="shrink-0">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-3-bg)]">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || "用户"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg text-zinc-500 dark:text-zinc-400">👤</span>
                )}
              </div>
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/users/${user.id}`}
                className="block truncate font-medium text-zinc-900 hover:underline dark:text-zinc-100"
              >
                {user.name || "匿名用户"}
              </Link>
              <div className="mt-2">
                <RelationButton
                  targetUserId={user.id}
                  initialStatus={user.initialStatus}
                />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
