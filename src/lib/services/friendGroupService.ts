import { prisma } from "../db";

export async function createFriendGroup(userId: string, name: string) {
  const existing = await prisma.friendGroup.findUnique({
    where: { userId_name: { userId, name } },
  });

  if (existing) {
    throw new Error('分组名称已存在');
  }

  return prisma.friendGroup.create({
    data: { userId, name },
  });
}

export async function updateFriendGroup(groupId: string, userId: string, name: string) {
  const group = await prisma.friendGroup.findUnique({ where: { id: groupId } });

  if (!group) {
    throw new Error('分组不存在');
  }

  if (group.userId !== userId) {
    throw new Error('无权修改此分组');
  }

  if (group.isDefault) {
    throw new Error('不能修改默认分组名称');
  }

  const existing = await prisma.friendGroup.findUnique({
    where: { userId_name: { userId, name } },
  });

  if (existing && existing.id !== groupId) {
    throw new Error('分组名称已存在');
  }

  return prisma.friendGroup.update({
    where: { id: groupId },
    data: { name },
  });
}

export async function deleteFriendGroup(groupId: string, userId: string) {
  const group = await prisma.friendGroup.findUnique({ where: { id: groupId } });

  if (!group) {
    throw new Error('分组不存在');
  }

  if (group.userId !== userId) {
    throw new Error('无权删除此分组');
  }

  if (group.isDefault) {
    throw new Error('不能删除默认分组');
  }

  await prisma.friendGroupMember.deleteMany({ where: { groupId } });

  return prisma.friendGroup.delete({ where: { id: groupId } });
}

export async function getUserFriendGroups(userId: string) {
  const groups = await prisma.friendGroup.findMany({
    where: { userId },
    orderBy: { sortOrder: 'asc' },
  });

  const defaultGroupExists = groups.some((g) => g.isDefault);

  if (!defaultGroupExists) {
    await prisma.friendGroup.create({
      data: { userId, name: '特别关注', isDefault: true, sortOrder: 0 },
    });
    return getUserFriendGroups(userId);
  }

  return groups;
}

export async function addFriendToGroup(groupId: string, userId: string, friendId: string) {
  const group = await prisma.friendGroup.findUnique({ where: { id: groupId } });

  if (!group) {
    throw new Error('分组不存在');
  }

  if (group.userId !== userId) {
    throw new Error('无权修改此分组');
  }

  const existing = await prisma.friendGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId: friendId } },
  });

  if (existing) {
    throw new Error('好友已在该分组中');
  }

  return prisma.friendGroupMember.create({
    data: { groupId, userId: friendId },
  });
}

export async function removeFriendFromGroup(groupId: string, userId: string, friendId: string) {
  const group = await prisma.friendGroup.findUnique({ where: { id: groupId } });

  if (!group) {
    throw new Error('分组不存在');
  }

  if (group.userId !== userId) {
    throw new Error('无权修改此分组');
  }

  const member = await prisma.friendGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId: friendId } },
  });

  if (!member) {
    throw new Error('好友不在该分组中');
  }

  return prisma.friendGroupMember.delete({ where: { id: member.id } });
}

export async function getGroupMembers(groupId: string, userId: string) {
  const group = await prisma.friendGroup.findUnique({ where: { id: groupId } });

  if (!group) {
    throw new Error('分组不存在');
  }

  if (group.userId !== userId) {
    throw new Error('无权查看此分组');
  }

  const members = await prisma.friendGroupMember.findMany({
    where: { groupId },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { addedAt: 'desc' },
  });

  return members.map((m) => m.user);
}

export async function getFriendGroupsForUser(userId: string, friendId: string) {
  const memberships = await prisma.friendGroupMember.findMany({
    where: { userId: friendId },
    include: { group: { select: { id: true, name: true, isDefault: true } } },
  });

  return memberships.map((m) => m.group);
}

export async function batchAddFriendsToGroup(groupId: string, userId: string, friendIds: string[]) {
  const group = await prisma.friendGroup.findUnique({ where: { id: groupId } });

  if (!group) {
    throw new Error('分组不存在');
  }

  if (group.userId !== userId) {
    throw new Error('无权修改此分组');
  }

  const existingMembers = await prisma.friendGroupMember.findMany({
    where: { groupId, userId: { in: friendIds } },
    select: { userId: true },
  });

  const existingIds = new Set(existingMembers.map((m) => m.userId));
  const newFriendIds = friendIds.filter((id) => !existingIds.has(id));

  const createPromises = newFriendIds.map((friendId) =>
    prisma.friendGroupMember.create({
      data: { groupId, userId: friendId },
    })
  );

  await Promise.all(createPromises);

  return newFriendIds.length;
}

export async function updateGroupSortOrder(userId: string, groupIds: string[]) {
  const updatePromises = groupIds.map((groupId, index) =>
    prisma.friendGroup.update({
      where: { id: groupId },
      data: { sortOrder: index },
    })
  );

  await Promise.all(updatePromises);
}