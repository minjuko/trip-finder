import { z } from "zod";

import { createTourApiResponseSchema } from "./common";

export const regionItemSchema = z.object({
  rnum: z.number(),
  code: z.string(),
  name: z.string(),
});

export const regionResponseSchema =
  createTourApiResponseSchema(regionItemSchema);

export type RegionItemDto = z.infer<typeof regionItemSchema>;
export type RegionResponseDto = z.infer<typeof regionResponseSchema>;
