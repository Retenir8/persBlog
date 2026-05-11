import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** 仅为首个注册用户填充示例分类/标签（各人数据独立） */
export async function GET() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) {
    return NextResponse.json(
      { error: "数据库中尚无用户，请先注册账号" },
      { status: 400 }
    );
  }

  const categories = [
    "技术", "生活", "随笔", "教程", "分享",
    "前端开发", "后端开发", "数据库", "算法", "数据结构",
    "人工智能", "机器学习", "深度学习", "移动开发",
    "云计算", "网络安全", "DevOps", "系统设计",
    "产品设计", "UI/UX", "产品经理", "项目管理",
    "职场经验", "学习方法", "读书分享", "旅行",
    "美食", "摄影", "音乐", "电影", "游戏",
    "健康", "健身", "投资理财", "创业"
  ];

  const tags = [
    "JavaScript", "React", "Next.js", "Node.js", "CSS", "HTML", "TypeScript",
    "Python", "Java", "Go", "Rust", "C++", "C#", "PHP",
    "Vue.js", "Angular", "Svelte", "TailwindCSS",
    "MySQL", "PostgreSQL", "MongoDB", "Redis",
    "Docker", "Kubernetes", "Git", "Linux",
    "API", "REST", "GraphQL", "微服务",
    "面试", "LeetCode", "计算机科学"
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: {
        userId_name: { userId: user.id, name },
      },
      update: {},
      create: { userId: user.id, name },
    });
  }

  for (const name of tags) {
    await prisma.tag.upsert({
      where: {
        userId_name: { userId: user.id, name },
      },
      update: {},
      create: { userId: user.id, name },
    });
  }

  return NextResponse.json({
    categories,
    tags,
    message: `已为首位用户 ${user.email} 写入示例分类与标签`,
  });
}
