import { z } from "zod";

import { createTourApiResponseSchema } from "./common";

export const classificationItemSchema = z.object({
  code: z.string(),
  name: z.string(),
  rnum: z.number(),
});

export const classificationResponseSchema = createTourApiResponseSchema(
  classificationItemSchema,
);

export type ClassificationItemDto = z.infer<typeof classificationItemSchema>;

export type ClassificationResponseDto = z.infer<
  typeof classificationResponseSchema
>;
