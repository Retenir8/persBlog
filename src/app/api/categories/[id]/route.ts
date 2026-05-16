import { NextResponse } from "next/server";
import {
  deleteCategory,
  updateCategory,
} from "@/lib/services/categoryTagService";
import { requireAuth } from "@/lib/auth-utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    if (typeof body?.name !== "string") {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }
    const cat = await updateCategory(id, body.name, user.id);
    return NextResponse.json(cat);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await deleteCategory(id, user.id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
