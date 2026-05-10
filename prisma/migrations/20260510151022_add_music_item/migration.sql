-- CreateEnum
CREATE TYPE "NeteaseKind" AS ENUM ('SONG', 'PLAYLIST');

-- CreateTable
CREATE TABLE "MusicItem" (
    "id" TEXT NOT NULL,
    "neteaseId" TEXT NOT NULL,
    "kind" "NeteaseKind" NOT NULL DEFAULT 'SONG',
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MusicItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MusicItem_neteaseId_kind_key" ON "MusicItem"("neteaseId", "kind");
