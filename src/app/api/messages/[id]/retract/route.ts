import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { retractMessage } from '@/lib/services/messageService';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const messageId = id;
    if (!messageId) {
      return NextResponse.json({ error: '缺少消息ID' }, { status: 400 });
    }

    await retractMessage(messageId, session.user.id);
    return NextResponse.json({ success: true, message: '撤回成功' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '撤回失败';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}