-- AlterTable
ALTER TABLE "User" ADD COLUMN "moodCalendarData" JSONB NOT NULL DEFAULT '{}'::jsonb;
