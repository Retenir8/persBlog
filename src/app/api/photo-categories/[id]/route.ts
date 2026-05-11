import { NextResponse } from "next/server";
import {
  deletePhotoCategory,
  updatePhotoCategory,
} from "@/lib/services/photoService";
import { requireAuth } from "@/lib/auth-utils";
import { Prisma } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await req.json();
    if (typeof body?.name !== "string") {
      return NextResponse.json({ error: "请填写名称" }, { status: 400 });
    }
    const cat = await updatePhotoCategory(id, body.name);
    return NextResponse.json(cat);
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
    const message = error instanceof Error ? error.message : "更新失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    await requireAuth();
    const { id } = await params;
    await deletePhotoCategory(id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "删除失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
