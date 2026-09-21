import { z } from "zod";

import { createTourApiResponseSchema } from "./common";

// 변경: detailImage2 실제 응답 계약
export const tourDetailImageItemSchema = z.object({
  contentid: z.string(),
  originimgurl: z.string(),
  imgname: z.string(),
  smallimageurl: z.string(),
  cpyrhtDivCd: z.string(),
  serialnum: z.string(),
});

export const tourDetailImageResponseSchema =
  createTourApiResponseSchema(
    tourDetailImageItemSchema,
  );

export type TourDetailImageItemDto = z.infer<
  typeof tourDetailImageItemSchema
>;

export type TourDetailImageResponseDto = z.infer<
  typeof tourDetailImageResponseSchema
>;