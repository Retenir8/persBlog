import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getConversations, getUnreadCount, updateConversationSetting, deleteConversation } from '@/lib/services/messageService';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const conversations = await getConversations(session.user.id);
    const unreadCount = await getUnreadCount(session.user.id);
    return NextResponse.json({ success: true, conversations, unreadCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { conversationId, isMuted, isPinned } = await request.json();

  if (!conversationId) {
    return NextResponse.json({ error: '缺少会话ID' }, { status: 400 });
  }

  try {
    const setting = await updateConversationSetting(conversationId, session.user.id, { isMuted, isPinned });
    return NextResponse.json({ success: true, setting });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId');

  if (!conversationId) {
    return NextResponse.json({ error: '缺少会话ID' }, { status: 400 });
  }

  try {
    await deleteConversation(conversationId, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}