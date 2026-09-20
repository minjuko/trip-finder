import { z } from "zod";

export const tourApiHeaderSchema = z.object({
  resultCode: z.string(),
  resultMsg: z.string(),
});

export const createTourApiResponseSchema = <T extends z.ZodType>(
  itemSchema: T,
) =>
  z.object({
    response: z.object({
      header: tourApiHeaderSchema,
      body: z.object({
        items: z.object({
          item: z.array(itemSchema),
        }),
        numOfRows: z.number(),
        pageNo: z.number(),
        totalCount: z.number(),
      }),
    }),
  });