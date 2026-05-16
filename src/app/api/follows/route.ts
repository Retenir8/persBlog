import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { followUser, unfollowUser, getRelationStatus } from '@/lib/services/followService';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get('targetUserId');

  if (!targetUserId) {
    return NextResponse.json({ error: '缺少目标用户ID' }, { status: 400 });
  }

  try {
    const status = await getRelationStatus(session.user.id, targetUserId);
    return NextResponse.json({ success: true, status: status.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { targetUserId, action } = await request.json();

  if (!targetUserId || !action) {
    return NextResponse.json({ error: '参数错误' }, { status: 400 });
  }

  try {
    if (action === 'follow') {
      await followUser(session.user.id, targetUserId);
      const status = await getRelationStatus(session.user.id, targetUserId);
      return NextResponse.json({ success: true, status });
    } else if (action === 'unfollow') {
      await unfollowUser(session.user.id, targetUserId);
      const status = await getRelationStatus(session.user.id, targetUserId);
      return NextResponse.json({ success: true, status });
    } else {
      return NextResponse.json({ error: '无效操作' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}