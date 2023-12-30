import * as z from "zod";

export const messageSchema = z.object({
  content: z.string().min(1).max(255, "Must be 255 characters or less"),
  conversationId: z.number(),
  images: z.array(z.string()).optional(),
  videos: z.array(z.string()).optional(),
});
