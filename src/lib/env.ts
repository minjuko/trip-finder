import "server-only";

import { z } from "zod";

const decodeServiceKey = (serviceKey: string): string => {
  try {
    // data.go.kr exposes both encoded and decoded keys. URLSearchParams
    // encodes values itself, so decode an encoded key before adding it.
    return decodeURIComponent(serviceKey);
  } catch {
    return serviceKey;
  }
};

const envSchema = z.object({
  TOUR_API_SERVICE_KEY: z
    .string()
    .trim()
    .min(1, "TOUR_API_SERVICE_KEY is required")
    .transform(decodeServiceKey),
});

export const env = envSchema.parse({
  TOUR_API_SERVICE_KEY: process.env.TOUR_API_SERVICE_KEY,
});
