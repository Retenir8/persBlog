import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        posts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USER_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to get user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id || session.user.id !== id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    const user = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        bio: data.bio,
        signature: data.signature,
        tags: data.tags,
        location: data.location,
        occupation: data.occupation,
        github: data.github,
        wechat: data.wechat,
        website: data.website,
      },
      include: {
        posts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USER_UPDATE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
