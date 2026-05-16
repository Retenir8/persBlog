import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { clearConversationMessages } from '@/lib/services/messageService';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const conversationId = id;
    if (!conversationId) {
      return NextResponse.json({ error: '缺少会话ID' }, { status: 400 });
    }

    await clearConversationMessages(conversationId, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '清空聊天记录失败';
    const status = message === '会话不存在' ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
