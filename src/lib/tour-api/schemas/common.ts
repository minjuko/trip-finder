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
        items: z.union([
          z.object({
            item: z.array(itemSchema),
          }),
          z.literal(""),
        ]),
        numOfRows: z.number(),
        pageNo: z.number(),
        totalCount: z.number(),
      }),
    }),
  });