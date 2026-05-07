import { NextResponse } from "next/server";
import {
  createComment,
  getCommentsForPost,
} from "@/lib/services/commentService";
import { getCurrentUser } from "@/lib/auth-utils";
import { getPostById, canViewPost } from "@/lib/services/postService";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const user = await getCurrentUser();
  const ok = await canViewPost(post, user?.id, user?.role);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const comments = await getCommentsForPost(id);
  return NextResponse.json(comments);
}

export async function POST(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await req.json();
    const content = body.content as string;
    if (typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }
    const user = await getCurrentUser();
    const comment = await createComment(
      id,
      content.trim(),
      user?.id,
      typeof body.guestName === "string" ? body.guestName : undefined,
      typeof body.parentId === "string" ? body.parentId : undefined
    );
    return NextResponse.json(comment, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
