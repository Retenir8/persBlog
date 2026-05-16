import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getFollowings,
  getFollowRequests,
  getRelationStatus,
} from "@/lib/services/followService";
import { PageIntro } from "@/components/layout/PageIntro";
import { SubscriptionsManageClient } from "@/components/social/SubscriptionsManageClient";
import { pagePrimaryCtaClassName } from "@/lib/surfaceStyles";

export default async function SubscriptionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.id !== id) {
    redirect(`/users/${session.user.id}/subscriptions`);
  }

  const [followRequests, followings] = await Promise.all([
    getFollowRequests(session.user.id),
    getFollowings(session.user.id),
  ]);

  const pendingFollowers = followRequests.map((r) => ({
    id: r.follower.id,
    name: r.follower.name,
    avatar: r.follower.avatar,
    initialStatus: "followed" as const,
  }));

  const followingCards = await Promise.all(
    followings.map(async (f) => {
      const relation = await getRelationStatus(session.user.id, f.following.id);
      return {
        id: f.following.id,
        name: f.following.name,
        avatar: f.following.avatar,
        initialStatus: relation.status,
      };
    }),
  );

  return (
    <div className="space-y-8">
      <PageIntro
        title="添加好友"
        description="与对方互相关注后即为好友，可在消息页收发私信。"
        action={
          <Link href="/messages" className={pagePrimaryCtaClassName}>
            前往消息
          </Link>
        }
      />

      <SubscriptionsManageClient
        pendingFollowers={pendingFollowers}
        followings={followingCards}
      />
    </div>
  );
}
