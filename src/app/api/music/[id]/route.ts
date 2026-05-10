import { NextResponse } from "next/server";
import { deleteMusicItem } from "@/lib/services/musicService";
import { requireAuth } from "@/lib/auth-utils";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    await deleteMusicItem(id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "删除失败" }, { status: 400 });
  }
}
