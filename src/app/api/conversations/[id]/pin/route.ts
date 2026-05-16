import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { updateConversationSetting } from '@/lib/services/messageService';

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
    const conversationId = id;
    if (!conversationId) {
      return NextResponse.json({ error: '缺少会话ID' }, { status: 400 });
    }

    await updateConversationSetting(conversationId, session.user.id, { isPinned: true });
    return NextResponse.json({ success: true, message: '已置顶会话' });
  } catch (error) {
    return NextResponse.json({ error: '置顶会话失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    await updateConversationSetting(conversationId, session.user.id, { isPinned: false });
    return NextResponse.json({ success: true, message: '已取消置顶' });
  } catch (error) {
    return NextResponse.json({ error: '取消置顶失败' }, { status: 500 });
  }
}