import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sendMessage, getConversationMessages, markMessagesAsRead, MessageContentType } from '@/lib/services/messageService';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '50');

  if (!conversationId) {
    return NextResponse.json({ error: '缺少会话ID' }, { status: 400 });
  }

  try {
    const result = await getConversationMessages(
      conversationId,
      session.user.id,
      page,
      pageSize,
    );
    await markMessagesAsRead(conversationId, session.user.id);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const contentType = request.headers.get('content-type');
  console.log('Content-Type:', contentType);
  
  if (contentType && contentType.includes('multipart')) {
    try {
      const formData = await request.formData();
      const recipientId = formData.get('recipientId') as string;
      const contentTypeValue = formData.get('contentType') as string;
      const file = formData.get('file') as File | null;

      console.log('FormData received:', { recipientId, contentTypeValue, hasFile: !!file });

      if (!recipientId) {
        return NextResponse.json({ error: '参数错误' }, { status: 400 });
      }

      let fileUrl: string | undefined;
      let fileName: string | undefined;

      if (file) {
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });
        
        const uniqueFileName = `${Date.now()}-${file.name}`;
        const filePath = join(uploadDir, uniqueFileName);
        
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);
        
        fileUrl = `/uploads/${uniqueFileName}`;
        fileName = file.name;
      }

      const message = await sendMessage(session.user.id, recipientId, {
        content: fileName || '文件',
        contentType: (contentTypeValue as MessageContentType) || 'FILE',
        fileUrl,
        fileName,
      });
      return NextResponse.json({ success: true, message });
    } catch (error: any) {
      console.error('FormData error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    try {
      const { recipientId, content, contentType, fileUrl, fileName } = await request.json();

      if (!recipientId || !content) {
        return NextResponse.json({ error: '参数错误' }, { status: 400 });
      }

      const message = await sendMessage(session.user.id, recipientId, {
        content,
        contentType,
        fileUrl,
        fileName,
      });
      return NextResponse.json({ success: true, message });
    } catch (error: any) {
      console.error('JSON error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
}