import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(3, "Required"),
  password: z.string().min(6, "Minimum 6 characters"),
});