import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { blacklistService } from '@/lib/services/blacklistService';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const blacklist = await blacklistService.getBlacklist(session.user.id);
    return NextResponse.json({ success: true, blacklist });
  } catch (error) {
    return NextResponse.json({ error: '获取黑名单失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { blockedUserId } = await request.json();
    if (!blockedUserId) {
      return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
    }

    await blacklistService.blockUser(session.user.id, blockedUserId);
    return NextResponse.json({ success: true, message: '拉黑成功' });
  } catch (error) {
    return NextResponse.json({ error: '拉黑失败' }, { status: 500 });
  }
}