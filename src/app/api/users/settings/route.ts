import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        readReceiptEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      settings: {
        readReceiptEnabled: user.readReceiptEnabled,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: '获取设置失败' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if ('readReceiptEnabled' in body) {
      updateData.readReceiptEnabled = body.readReceiptEnabled;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '没有提供更新的设置' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        readReceiptEnabled: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: '设置更新成功',
      settings: {
        readReceiptEnabled: user.readReceiptEnabled,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: '更新设置失败' }, { status: 500 });
  }
}