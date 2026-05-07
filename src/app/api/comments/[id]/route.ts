import { NextResponse } from "next/server";
import { deleteComment } from "@/lib/services/commentService";
import { requireAuth } from "@/lib/auth-utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await deleteComment(id, user.id, user.role);
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
