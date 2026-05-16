import { NextResponse } from "next/server";
import type { BookStatus } from "@/generated/prisma";
import {
  deleteBookshelfItem,
  updateBookshelfItem,
} from "@/lib/services/bookshelfService";
import { requireAuth } from "@/lib/auth-utils";

const STATUSES: BookStatus[] = ["WANT_TO_READ", "READING", "FINISHED"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const data: Parameters<typeof updateBookshelfItem>[2] = {};

    if (typeof body.title === "string") data.title = body.title;
    if (body.author === null || typeof body.author === "string") {
      data.author = body.author;
    }
    if (body.coverUrl === null || typeof body.coverUrl === "string") {
      data.coverUrl = body.coverUrl;
    }
    if (body.note === null || typeof body.note === "string") {
      data.note = body.note;
    }
    if (
      typeof body.status === "string" &&
      STATUSES.includes(body.status as BookStatus)
    ) {
      data.status = body.status as BookStatus;
    }
    if (body.rating === null || typeof body.rating === "number") {
      data.rating = body.rating;
    }
    if (body.linkUrl === null || typeof body.linkUrl === "string") {
      data.linkUrl = body.linkUrl;
    }

    const item = await updateBookshelfItem(id, user.id, data);
    return NextResponse.json(item);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "无权修改" }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : "更新失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await deleteBookshelfItem(id, user.id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "无权删除" }, { status: 403 });
    }
    return NextResponse.json({ error: "删除失败" }, { status: 400 });
  }
}
