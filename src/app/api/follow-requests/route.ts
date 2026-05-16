import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getFollowRequests, followUser } from '@/lib/services/followService';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const requests = await getFollowRequests(session.user.id);
    return NextResponse.json({ success: true, data: requests });
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
    if (action === 'accept') {
      await followUser(session.user.id, targetUserId);
      return NextResponse.json({ success: true });
    } else if (action === 'ignore') {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: '无效操作' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}