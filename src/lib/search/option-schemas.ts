import { z } from "zod";

export const regionOptionResponseSchema = z.array(
  z.object({
    code: z.string().min(1),
    name: z.string().min(1),
  }),
);

export const classificationOptionResponseSchema = z.array(
  z.object({
    code: z.string().min(1),
    name: z.string().min(1),
  }),
);
