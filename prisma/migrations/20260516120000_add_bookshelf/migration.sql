-- CreateEnum
CREATE TYPE "BookStatus" AS ENUM ('WANT_TO_READ', 'READING', 'FINISHED');

-- CreateTable
CREATE TABLE "BookshelfItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "coverUrl" TEXT,
    "note" TEXT,
    "status" "BookStatus" NOT NULL DEFAULT 'WANT_TO_READ',
    "rating" INTEGER,
    "linkUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "BookshelfItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookshelfItem_userId_idx" ON "BookshelfItem"("userId");

-- CreateIndex
CREATE INDEX "BookshelfItem_userId_status_idx" ON "BookshelfItem"("userId", "status");

-- AddForeignKey
ALTER TABLE "BookshelfItem" ADD CONSTRAINT "BookshelfItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
