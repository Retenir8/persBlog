import { NextResponse } from "next/server";
import {
  createPhotoCategory,
  listPhotoCategories,
} from "@/lib/services/photoService";
import { requireAuth } from "@/lib/auth-utils";
import { Prisma } from "@prisma/client";

export async function GET() {
  const categories = await listPhotoCategories();
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  try {
    await requireAuth();
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name : "";
    const cat = await createPhotoCategory(name);
    return NextResponse.json(cat, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "该分类名称已存在" }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "创建失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
