/*
  Warnings:

  - A unique constraint covering the columns `[commentId]` on the table `Image` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[commentId]` on the table `Video` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Image_commentId_key" ON "Image"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "Video_commentId_key" ON "Video"("commentId");
