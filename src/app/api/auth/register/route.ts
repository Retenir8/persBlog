import { NextResponse } from "next/server";
import { createUser } from "@/lib/services/userService";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.includes("@")
    ) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }
    await createUser(email, password, typeof name === "string" ? name : undefined);
    return NextResponse.json({ message: "User created" }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
