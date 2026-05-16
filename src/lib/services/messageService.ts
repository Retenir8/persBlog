import { prisma } from "../db";

export type MessageContentType = 'TEXT' | 'IMAGE' | 'LINK' | 'FILE';

export interface MessageData {
  content: string;
  contentType?: MessageContentType;
  fileUrl?: string;
  fileName?: string;
}

const RETRACT_TIME_LIMIT = 2 * 60 * 1000;

export async function retractMessage(messageId: string, userId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { conversation: true },
  });

  if (!message) {
    throw new Error('消息不存在');
  }

  if (message.senderId !== userId) {
    throw new Error('只能撤回自己发送的消息');
  }

  const now = new Date().getTime();
  const messageTime = new Date(message.createdAt).getTime();
  
  if (now - messageTime > RETRACT_TIME_LIMIT) {
    throw new Error('消息超过2分钟，无法撤回');
  }

  return prisma.message.update({
    where: { id: messageId },
    data: { isRetracted: true, retractedAt: new Date() },
  });
}

export async function getOfflineMessages(userId: string, days: number = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      messages: {
        where: {
          senderId: { not: userId },
          isRead: false,
          createdAt: { gte: cutoffDate },
        },
        include: { sender: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'asc' },
      },
      user1: { select: { id: true, name: true, avatar: true } },
      user2: { select: { id: true, name: true, avatar: true } },
    },
  });

  return conversations.map((conv) => {
    const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
    return {
      conversationId: conv.id,
      otherUser,
      messages: conv.messages,
    };
  });
}

export async function getOrCreateConversation(userId: string, targetUserId: string) {
  if (userId === targetUserId) {
    throw new Error('不能与自己创建会话');
  }

  let conversation = await prisma.conversation.findFirst({
    where: {
      OR: [
        { user1Id: userId, user2Id: targetUserId },
        { user1Id: targetUserId, user2Id: userId },
      ],
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        user1Id: userId,
        user2Id: targetUserId,
      },
    });
  }

  return conversation;
}

export async function sendMessage(
  senderId: string,
  recipientId: string,
  data: MessageData
) {
  const conversation = await getOrCreateConversation(senderId, recipientId);

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId,
      content: data.content,
      contentType: data.contentType || 'TEXT',
      fileUrl: data.fileUrl,
      fileName: data.fileName,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  return message;
}

export async function getConversationMessages(conversationId: string, page: number = 1, pageSize: number = 50) {
  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.message.count({ where: { conversationId } }),
  ]);

  return { messages: messages.reverse(), total, page, pageSize };
}

export async function getConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      user1: { select: { id: true, name: true, avatar: true } },
      user2: { select: { id: true, name: true, avatar: true } },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        select: { content: true, createdAt: true, contentType: true },
      },
      setting: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return conversations.map((conv) => {
    const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
    const lastMessage = conv.messages[0];
    
    return {
      id: conv.id,
      otherUser,
      lastMessage: lastMessage?.content || '',
      lastMessageTime: lastMessage?.createdAt,
      lastMessageType: lastMessage?.contentType,
      isMuted: conv.setting?.isMuted || false,
      isPinned: conv.setting?.isPinned || false,
      updatedAt: conv.updatedAt,
    };
  });
}

export async function markMessagesAsRead(conversationId: string, userId: string) {
  return prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      isRead: false,
    },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function getUnreadCount(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      messages: {
        where: { senderId: { not: userId }, isRead: false },
      },
      setting: true,
    },
  });

  return conversations.reduce((acc, conv) => {
    if (!conv.setting?.isMuted) {
      acc += conv.messages.length;
    }
    return acc;
  }, 0);
}

export async function updateConversationSetting(
  conversationId: string,
  userId: string,
  data: { isMuted?: boolean; isPinned?: boolean }
) {
  let setting = await prisma.conversationSetting.findUnique({
    where: { conversationId },
  });

  if (!setting) {
    setting = await prisma.conversationSetting.create({
      data: {
        conversationId,
        userId,
        isMuted: data.isMuted || false,
        isPinned: data.isPinned || false,
      },
    });
  } else {
    setting = await prisma.conversationSetting.update({
      where: { conversationId },
      data,
    });
  }

  return setting;
}

export async function deleteConversation(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new Error('会话不存在');
  }

  if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
    throw new Error('无权删除此会话');
  }

  return prisma.conversation.delete({ where: { id: conversationId } });
}