-- AlterTable
ALTER TABLE "User" ADD COLUMN "profileWidgets" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
