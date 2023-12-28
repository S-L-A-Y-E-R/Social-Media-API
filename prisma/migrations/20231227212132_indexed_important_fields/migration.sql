-- DropIndex
DROP INDEX "User_username_email_idx";

-- CreateIndex
CREATE INDEX "Comment_content_idx" ON "Comment"("content");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE INDEX "Comment_postId_idx" ON "Comment"("postId");

-- CreateIndex
CREATE INDEX "Image_url_idx" ON "Image"("url");

-- CreateIndex
CREATE INDEX "Image_profileId_idx" ON "Image"("profileId");

-- CreateIndex
CREATE INDEX "Image_posttId_idx" ON "Image"("posttId");

-- CreateIndex
CREATE INDEX "Like_authorId_idx" ON "Like"("authorId");

-- CreateIndex
CREATE INDEX "Like_postId_idx" ON "Like"("postId");

-- CreateIndex
CREATE INDEX "Like_commentId_idx" ON "Like"("commentId");

-- CreateIndex
CREATE INDEX "Post_content_idx" ON "Post"("content");

-- CreateIndex
CREATE INDEX "Post_privacy_idx" ON "Post"("privacy");

-- CreateIndex
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");

-- CreateIndex
CREATE INDEX "PostProfile_postId_idx" ON "PostProfile"("postId");

-- CreateIndex
CREATE INDEX "PostProfile_profileId_idx" ON "PostProfile"("profileId");

-- CreateIndex
CREATE INDEX "Subscription_endpoint_idx" ON "Subscription"("endpoint");

-- CreateIndex
CREATE INDEX "Subscription_profileId_idx" ON "Subscription"("profileId");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Video_url_idx" ON "Video"("url");

-- CreateIndex
CREATE INDEX "Video_posttId_idx" ON "Video"("posttId");

-- CreateIndex
CREATE INDEX "Video_commentId_idx" ON "Video"("commentId");
