import { prisma } from "@/lib/db";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const post = await prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });
    
    return Response.json({ viewCount: post.viewCount });
  } catch (error) {
    return Response.json({ error: "Failed to update view count" }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      select: { viewCount: true },
    });
    
    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }
    
    return Response.json({ viewCount: post.viewCount });
  } catch (error) {
    return Response.json({ error: "Failed to get view count" }, { status: 500 });
  }
}