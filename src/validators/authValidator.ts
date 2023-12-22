import * as z from "zod";

export const signUpSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(8).max(20),
  birthDate: z.date(),
  fullName: z.string().min(3).max(50),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(20),
});
