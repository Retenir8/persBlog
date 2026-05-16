import { NextResponse } from "next/server";
import type { BookStatus } from "@/generated/prisma";
import {
  createBookshelfItem,
  listBookshelfItems,
} from "@/lib/services/bookshelfService";
import { requireAuth } from "@/lib/auth-utils";

const STATUSES: BookStatus[] = ["WANT_TO_READ", "READING", "FINISHED"];

function parseStatus(v: string | null): BookStatus | undefined {
  if (!v || v === "all") return undefined;
  return STATUSES.includes(v as BookStatus) ? (v as BookStatus) : undefined;
}

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const status = parseStatus(new URL(req.url).searchParams.get("status"));
    const items = await listBookshelfItems(user.id, status);
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
    const title = typeof body.title === "string" ? body.title : "";
    const author = typeof body.author === "string" ? body.author : undefined;
    const coverUrl =
      typeof body.coverUrl === "string" ? body.coverUrl : undefined;
    const note = typeof body.note === "string" ? body.note : undefined;
    const linkUrl = typeof body.linkUrl === "string" ? body.linkUrl : undefined;
    const status =
      typeof body.status === "string" &&
      STATUSES.includes(body.status as BookStatus)
        ? (body.status as BookStatus)
        : undefined;
    const rating =
      typeof body.rating === "number"
        ? body.rating
        : body.rating === null
          ? null
          : undefined;

    const item = await createBookshelfItem(user.id, {
      title,
      author,
      coverUrl,
      note,
      status,
      rating: rating ?? undefined,
      linkUrl,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "添加失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
