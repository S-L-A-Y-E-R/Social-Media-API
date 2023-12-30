/*
  Warnings:

  - A unique constraint covering the columns `[messageId]` on the table `Image` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[authorId]` on the table `Like` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[postId]` on the table `Like` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[commentId]` on the table `Like` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[messageId]` on the table `Video` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubscriptionType" ADD VALUE 'NEW_COMMENT';
ALTER TYPE "SubscriptionType" ADD VALUE 'NEW_LIKE';
ALTER TYPE "SubscriptionType" ADD VALUE 'MENTION';

-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "messageId" INTEGER;

-- AlterTable
ALTER TABLE "Like" ALTER COLUMN "postId" DROP NOT NULL,
ALTER COLUMN "commentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "messageId" INTEGER;

-- CreateTable
CREATE TABLE "Conversation" (
    "id" SERIAL NOT NULL,
    "profileOneId" INTEGER NOT NULL,
    "profileTwoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BlockRelation" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX "Conversation_profileOneId_idx" ON "Conversation"("profileOneId");

-- CreateIndex
CREATE INDEX "Conversation_profileTwoId_idx" ON "Conversation"("profileTwoId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "_BlockRelation_AB_unique" ON "_BlockRelation"("A", "B");

-- CreateIndex
CREATE INDEX "_BlockRelation_B_index" ON "_BlockRelation"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Image_messageId_key" ON "Image"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_authorId_key" ON "Like"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_postId_key" ON "Like"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_commentId_key" ON "Like"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "Video_messageId_key" ON "Video"("messageId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_profileOneId_fkey" FOREIGN KEY ("profileOneId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_profileTwoId_fkey" FOREIGN KEY ("profileTwoId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlockRelation" ADD CONSTRAINT "_BlockRelation_A_fkey" FOREIGN KEY ("A") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlockRelation" ADD CONSTRAINT "_BlockRelation_B_fkey" FOREIGN KEY ("B") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
