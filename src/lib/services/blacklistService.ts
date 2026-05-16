import { prisma } from '@/lib/db';

export const blacklistService = {
  async blockUser(userId: string, blockedUserId: string) {
    return await prisma.blacklist.create({
      data: {
        userId,
        blockedUserId,
      },
    });
  },

  async unblockUser(userId: string, blockedUserId: string) {
    return await prisma.blacklist.delete({
      where: {
        userId_blockedUserId: {
          userId,
          blockedUserId,
        },
      },
    });
  },

  async getBlacklist(userId: string) {
    return await prisma.blacklist.findMany({
      where: { userId },
      include: { blockedUser: true },
    });
  },

  async isBlocked(userId: string, targetUserId: string) {
    const result = await prisma.blacklist.findUnique({
      where: {
        userId_blockedUserId: {
          userId,
          blockedUserId: targetUserId,
        },
      },
    });
    return result !== null;
  },

  async checkBlockRelationship(userId: string, targetUserId: string) {
    const userBlockedTarget = await this.isBlocked(userId, targetUserId);
    const targetBlockedUser = await this.isBlocked(targetUserId, userId);
    return {
      userBlockedTarget,
      targetBlockedUser,
      anyBlocked: userBlockedTarget || targetBlockedUser,
    };
  },
};