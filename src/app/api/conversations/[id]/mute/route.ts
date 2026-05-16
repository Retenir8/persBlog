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

    await updateConversationSetting(conversationId, session.user.id, { isMuted: true });
    return NextResponse.json({ success: true, message: '已设置免打扰' });
  } catch (error) {
    return NextResponse.json({ error: '设置免打扰失败' }, { status: 500 });
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

    await updateConversationSetting(conversationId, session.user.id, { isMuted: false });
    return NextResponse.json({ success: true, message: '已取消免打扰' });
  } catch (error) {
    return NextResponse.json({ error: '取消免打扰失败' }, { status: 500 });
  }
}