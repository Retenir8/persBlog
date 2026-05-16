import { NextResponse } from "next/server";
import {
  getPostById,
  updatePost,
  deletePost,
  canViewPost,
} from "@/lib/services/postService";
import { getCurrentUser, requireAuth } from "@/lib/auth-utils";

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
  return NextResponse.json(post);
}

export async function PUT(req: Request, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const cat = body.categoryId;
    const categoryId =
      cat === undefined
        ? undefined
        : cat === null || cat === ""
          ? null
          : typeof cat === "string"
            ? cat
            : undefined;
    
    const validVisibility = ["PUBLIC", "FRIENDS", "GROUP"].includes(body.visibility) 
      ? body.visibility 
      : undefined;
    
    const post = await updatePost(id, user.id, user.role, {
      title: body.title,
      content: body.content,
      categoryId,
      tagIds: body.tagIds,
      published: body.published,
      visibility: validVisibility,
      visibleGroupIds: typeof body.visibleGroupIds === "string" ? body.visibleGroupIds : undefined,
      invisibleGroupIds: typeof body.invisibleGroupIds === "string" ? body.invisibleGroupIds : undefined,
    });
    return NextResponse.json(post);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      message === "Unauthorized"
        ? 401
        : message === "Forbidden"
          ? 403
          : message === "Not found"
            ? 404
            : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await deletePost(id, user.id, user.role);
    return NextResponse.json({ message: "Deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      message === "Unauthorized"
        ? 401
        : message === "Forbidden"
          ? 403
          : message === "Not found"
            ? 404
            : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
