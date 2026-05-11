-- Scope Category, Tag, MusicItem, PhotoCategory, Photo to User (backfill to first user by signup time)

-- Category
ALTER TABLE "Category" ADD COLUMN "userId" TEXT;
UPDATE "Category" SET "userId" = (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1);
ALTER TABLE "Category" ALTER COLUMN "userId" SET NOT NULL;
DROP INDEX IF EXISTS "Category_name_key";
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Category_userId_name_key" ON "Category"("userId", "name");

-- Tag
ALTER TABLE "Tag" ADD COLUMN "userId" TEXT;
UPDATE "Tag" SET "userId" = (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1);
ALTER TABLE "Tag" ALTER COLUMN "userId" SET NOT NULL;
DROP INDEX IF EXISTS "Tag_name_key";
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Tag_userId_name_key" ON "Tag"("userId", "name");

-- MusicItem
ALTER TABLE "MusicItem" ADD COLUMN "userId" TEXT;
UPDATE "MusicItem" SET "userId" = (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1);
ALTER TABLE "MusicItem" ALTER COLUMN "userId" SET NOT NULL;
DROP INDEX IF EXISTS "MusicItem_neteaseId_kind_key";
ALTER TABLE "MusicItem" ADD CONSTRAINT "MusicItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "MusicItem_userId_neteaseId_kind_key" ON "MusicItem"("userId", "neteaseId", "kind");

-- PhotoCategory
ALTER TABLE "PhotoCategory" ADD COLUMN "userId" TEXT;
UPDATE "PhotoCategory" SET "userId" = (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1);
ALTER TABLE "PhotoCategory" ALTER COLUMN "userId" SET NOT NULL;
DROP INDEX IF EXISTS "PhotoCategory_name_key";
ALTER TABLE "PhotoCategory" ADD CONSTRAINT "PhotoCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "PhotoCategory_userId_name_key" ON "PhotoCategory"("userId", "name");

-- Photo
ALTER TABLE "Photo" ADD COLUMN "userId" TEXT;
UPDATE "Photo" SET "userId" = (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1);
ALTER TABLE "Photo" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
