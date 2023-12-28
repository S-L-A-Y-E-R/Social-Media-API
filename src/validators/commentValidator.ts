import * as z from "zod";

export const commentSchema = z.object({
  content: z.string().min(1).max(255, "Must be 255 characters or less"),
  postId: z.number(),
  authorId: z.number(),
  image: z.string().optional(),
  video: z.string().optional(),
});
