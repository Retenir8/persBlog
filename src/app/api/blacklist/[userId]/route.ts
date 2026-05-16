import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { blacklistService } from '@/lib/services/blacklistService';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  const { userId } = await params;
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const blockedUserId = userId;
    if (!blockedUserId) {
      return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
    }

    await blacklistService.unblockUser(session.user.id, blockedUserId);
    return NextResponse.json({ success: true, message: '取消拉黑成功' });
  } catch (error) {
    return NextResponse.json({ error: '取消拉黑失败' }, { status: 500 });
  }
}