import * as z from "zod";

export const postSchema = z.object({
  content: z.string().min(1).max(255, "Must be 255 characters or less"),
  privacy: z.enum(["PUBLIC", "PRIVATE", "FRIENDS"]).default("PUBLIC"),
  authorId: z.number(),
  images: z.array(z.string()).optional(),
  videos: z.array(z.string()).optional(),
});
