import { NextResponse } from "next/server";
import { deletePhotoRecord } from "@/lib/services/photoService";
import { removePhotoFileFromPublicUrl } from "@/lib/photoUpload";
import { requireAuth } from "@/lib/auth-utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    await requireAuth();
    const { id } = await params;
    const row = await deletePhotoRecord(id);
    if (!row) {
      return NextResponse.json({ error: "照片不存在" }, { status: 404 });
    }
    await removePhotoFileFromPublicUrl(row.imageUrl);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "删除失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
