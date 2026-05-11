-- CreateTable
CREATE TABLE "PhotoCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PhotoCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "imageUrl" TEXT NOT NULL,
    "categoryId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhotoCategory_name_key" ON "PhotoCategory"("name");

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PhotoCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
