import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getMutualFriends } from '@/lib/services/followService';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const friends = await getMutualFriends(session.user.id);
    return NextResponse.json({
      success: true,
      friends: friends.map((f) => ({
        id: f.follower.id,
        name: f.follower.name,
        avatar: f.follower.avatar,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}