import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createFriendGroup, getUserFriendGroups, addFriendToGroup, removeFriendFromGroup } from '@/lib/services/friendGroupService';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const groups = await getUserFriendGroups(session.user.id);
    return NextResponse.json({ success: true, groups });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { name, action, groupId, friendId } = await request.json();

  try {
    if (action === 'create') {
      const group = await createFriendGroup(session.user.id, name);
      return NextResponse.json({ success: true, group });
    } else if (action === 'addFriend') {
      await addFriendToGroup(groupId, session.user.id, friendId);
      return NextResponse.json({ success: true });
    } else if (action === 'removeFriend') {
      await removeFriendFromGroup(groupId, session.user.id, friendId);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: '无效操作' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}