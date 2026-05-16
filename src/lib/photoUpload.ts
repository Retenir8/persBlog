import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const ALLOWED = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/gif", ".gif"],
  ["image/webp", ".webp"],
]);

const MAX_BYTES = 12 * 1024 * 1024;

export type SavedUpload = { imageUrl: string; absolutePath: string };

export async function savePhotoFile(file: File): Promise<SavedUpload> {
  if (!file.size || file.size > MAX_BYTES) {
    throw new Error("图片需在 12MB 以内");
  }
  const ext = ALLOWED.get(file.type);
  if (!ext) {
    throw new Error("仅支持 JPEG、PNG、GIF、WebP");
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > MAX_BYTES) {
    throw new Error("图片需在 12MB 以内");
  }

  const dir = path.join(process.cwd(), "public", "uploads", "photos");
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}${ext}`;
  const absolutePath = path.join(dir, filename);
  await writeFile(absolutePath, buf);

  const imageUrl = `/uploads/photos/${filename}`;
  return { imageUrl, absolutePath };
}

export async function removePhotoFileFromPublicUrl(imageUrl: string) {
  if (!imageUrl.startsWith("/uploads/photos/")) return;
  const rel = imageUrl.slice("/uploads/photos/".length);
  if (!rel || rel.includes("..") || path.normalize(rel) !== rel) return;
  const absolutePath = path.join(
    process.cwd(),
    "public",
    "uploads",
    "photos",
    rel
  );
  try {
    await unlink(absolutePath);
  } catch {
    // ignore missing file
  }
}
