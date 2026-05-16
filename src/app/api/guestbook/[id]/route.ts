import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteGuestbookEntry } from "@/lib/services/guestbookService";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: entryId } = await params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    await deleteGuestbookEntry(
      entryId,
      session.user.id,
      session.user.role ?? "USER"
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "删除失败";
    if (msg === "Not found") {
      return NextResponse.json({ error: "留言不存在" }, { status: 404 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "无权删除" }, { status: 403 });
    }
    console.error(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
