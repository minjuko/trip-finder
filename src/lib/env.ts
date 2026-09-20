import "server-only";

import { z } from "zod";

const envSchema = z.object({
  TOUR_API_SERVICE_KEY: z.string().min(1, "TOUR_API_SERVICE_KEY is required"),
});

export const env = envSchema.parse({
  TOUR_API_SERVICE_KEY: process.env.TOUR_API_SERVICE_KEY,
});