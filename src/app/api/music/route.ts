import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {
  createMusicItemFromUrl,
  listMusicItems,
} from "@/lib/services/musicService";
import { requireAuth } from "@/lib/auth-utils";

export async function GET() {
  try {
    const user = await requireAuth();
    const items = await listMusicItems(user.id);
    return NextResponse.json(items);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "加载失败" }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const url = typeof body.url === "string" ? body.url : "";
    const noteRaw = typeof body.note === "string" ? body.note.trim() : "";
    if (!url.trim()) {
      return NextResponse.json({ error: "请填写网易云链接" }, { status: 400 });
    }
    if (!noteRaw) {
      return NextResponse.json({ error: "请填写歌名" }, { status: 400 });
    }
    const item = await createMusicItemFromUrl(url, noteRaw, user.id);
    return NextResponse.json(item, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "该单曲或歌单已在列表中" },
        { status: 409 }
      );
    }
    const message =
      error instanceof Error ? error.message : "添加失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
