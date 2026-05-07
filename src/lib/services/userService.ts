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
