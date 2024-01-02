import * as z from "zod";

export const storyValidator = z.object({
  authorId: z.number(),
  content: z.string().min(3),
  privacy: z.enum(["PUBLIC", "PRIVATE", "FRIENDS"]),
  expiryTime: z.date(),
  image: z.string().url().optional(),
  video: z.string().url().optional(),
});
