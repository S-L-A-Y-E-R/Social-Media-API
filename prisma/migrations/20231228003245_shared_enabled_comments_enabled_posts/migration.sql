-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "commentsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sharesEnabled" BOOLEAN NOT NULL DEFAULT true;
