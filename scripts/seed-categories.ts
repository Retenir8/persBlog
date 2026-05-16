import { prisma } from "@/lib/db";

async function seedCategories() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) {
    console.log("❌ 无用户，请先注册");
    return;
  }

  const categories = ["技术", "生活", "随笔", "教程", "分享"];

  for (const name of categories) {
    try {
      await prisma.category.upsert({
        where: {
          userId_name: { userId: user.id, name },
        },
        update: {},
        create: { userId: user.id, name },
      });
      console.log(`✅ 创建/更新分类: ${name}`);
    } catch (error) {
      console.log(`❌ 处理分类 ${name} 失败:`, error);
    }
  }

  console.log("\n🎉 分类数据初始化完成！");
}

seedCategories()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
