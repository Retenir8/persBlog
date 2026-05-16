import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createGuestbookEntry,
  listGuestbookForHost,
} from "@/lib/services/guestbookService";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const entries = await listGuestbookForHost(id);
    if (entries === null) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }
    return NextResponse.json(entries);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "加载留言失败" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: hostUserId } = await params;
  try {
    const session = await auth();
    const body = await request.json();
    const content = typeof body.content === "string" ? body.content : "";
    const guestName =
      typeof body.guestName === "string" ? body.guestName : undefined;

    if (!content.trim()) {
      return NextResponse.json({ error: "请输入留言内容" }, { status: 400 });
    }

    if (!session?.user && !guestName?.trim()) {
      return NextResponse.json(
        { error: "未登录留言需填写昵称" },
        { status: 400 }
      );
    }

    const entry = await createGuestbookEntry({
      hostUserId,
      content,
      authorUserId: session?.user?.id ?? null,
      guestName,
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "留言失败";
    const status =
      msg === "用户不存在"
        ? 404
        : msg.startsWith("不能")
          ? 400
          : msg.includes("昵称")
            ? 400
            : 500;
    if (status === 500) console.error(e);
    return NextResponse.json({ error: msg }, { status });
  }
}
