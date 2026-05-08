import bcrypt from "bcryptjs";
import { prisma } from "../db";

export async function createUser(
  email: string,
  password: string,
  name?: string
) {
  const existed = await prisma.user.findUnique({ where: { email } });
  if (existed) throw new Error("User already exists");
  const hashed = await bcrypt.hash(password, 12);
  return prisma.user.create({
    data: { email, password: hashed, name },
  });
}

export async function getUserWithPosts(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      posts: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function updateUser(
  userId: string,
  data: {
    name?: string;
    bio?: string;
    signature?: string;
    tags?: string;
    location?: string;
    occupation?: string;
    github?: string;
    wechat?: string;
    website?: string;
  }
) {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}
