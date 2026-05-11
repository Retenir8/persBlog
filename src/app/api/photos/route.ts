import { NextResponse } from "next/server";
import {
  createPhotoRecord,
  listPhotos,
} from "@/lib/services/photoService";
import { savePhotoFile } from "@/lib/photoUpload";
import { requireAuth } from "@/lib/auth-utils";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cat = url.searchParams.get("category");
  const categoryId =
    cat && cat !== "all" && cat !== "" ? cat : undefined;
  const photos = await listPhotos(categoryId);
  return NextResponse.json(photos);
}

export async function POST(req: Request) {
  try {
    await requireAuth();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) {
      return NextResponse.json({ error: "请选择图片文件" }, { status: 400 });
    }

    const titleRaw = form.get("title");
    const title =
      typeof titleRaw === "string" ? titleRaw.trim() || undefined : undefined;

    const catRaw = form.get("categoryId");
    let categoryId: string | null | undefined;
    if (typeof catRaw === "string") {
      const t = catRaw.trim();
      categoryId = t === "" ? null : t;
    }

    const { imageUrl } = await savePhotoFile(file);
    const photo = await createPhotoRecord({
      imageUrl,
      title,
      categoryId,
    });
    return NextResponse.json(photo, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "上传失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
