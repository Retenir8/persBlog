import { NextRequest, NextResponse } from "next/server";
import { searchPosts, createPost } from "@/lib/services/postService";
import { requireAuth } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");
  const result = await searchPosts({
    page,
    pageSize,
    keyword: searchParams.get("keyword") || undefined,
  });
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { title, content, categoryId, tagIds, published, visibility, visibleGroupIds, invisibleGroupIds } = body;
    if (typeof title !== "string" || typeof content !== "string") {
      return NextResponse.json(
        { error: "title and content are required" },
        { status: 400 }
      );
    }
    
    const validVisibility = ["PUBLIC", "FRIENDS", "GROUP"].includes(visibility) 
      ? visibility 
      : "PUBLIC";
    
    const post = await createPost(user.id, {
      title,
      content,
      categoryId:
        categoryId === null
          ? null
          : typeof categoryId === "string" && categoryId
            ? categoryId
            : undefined,
      tagIds: Array.isArray(tagIds)
        ? tagIds.filter((id: unknown): id is string => typeof id === "string")
        : undefined,
      published: typeof published === "boolean" ? published : undefined,
      visibility: validVisibility,
      visibleGroupIds: typeof visibleGroupIds === "string" ? visibleGroupIds : JSON.stringify([]),
      invisibleGroupIds: typeof invisibleGroupIds === "string" ? invisibleGroupIds : JSON.stringify([]),
    });
    return NextResponse.json(post, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
