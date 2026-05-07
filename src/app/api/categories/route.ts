import { NextResponse } from "next/server";
import {
  listCategories,
  createCategory,
} from "@/lib/services/categoryTagService";
import { requireAuth } from "@/lib/auth-utils";

export async function GET() {
  const categories = await listCategories();
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  try {
    await requireAuth();
    const { name } = await req.json();
    if (typeof name !== "string") {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }
    const cat = await createCategory(name);
    return NextResponse.json(cat, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
