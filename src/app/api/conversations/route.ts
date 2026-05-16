import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getConversations,
  getUnreadCount,
  updateConversationSetting,
  deleteConversation,
  getOrCreateConversation,
  getConversationById,
} from '@/lib/services/messageService';

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

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { recipientId } = await request.json();

  if (!recipientId || typeof recipientId !== 'string') {
    return NextResponse.json({ error: '缺少对方用户 ID' }, { status: 400 });
  }

  try {
    const { id } = await getOrCreateConversation(session.user.id, recipientId);
    const conversation = await getConversationById(id, session.user.id);
    return NextResponse.json({ success: true, conversation });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '创建会话失败';
    return NextResponse.json({ error: message }, { status: 500 });
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