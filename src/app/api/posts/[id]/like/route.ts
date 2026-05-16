import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: session.user.id,
        },
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });
      
      const count = await prisma.like.count({ where: { postId: id } });
      return Response.json({ liked: false, count });
    } else {
      await prisma.like.create({
        data: {
          postId: id,
          userId: session.user.id,
        },
      });
      
      const count = await prisma.like.count({ where: { postId: id } });
      return Response.json({ liked: true, count });
    }
  } catch (error) {
    return Response.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  try {
    const count = await prisma.like.count({ where: { postId: id } });
    const liked = session?.user?.id
      ? !!(await prisma.like.findUnique({
          where: {
            postId_userId: {
              postId: id,
              userId: session.user.id,
            },
          },
        }))
      : false;

    return Response.json({ liked, count });
  } catch (error) {
    return Response.json({ error: "Failed to get likes" }, { status: 500 });
  }
}