import { z } from "zod";

import { createTourApiResponseSchema } from "./common";

// 변경: detailCommon2 실제 응답 계약
export const tourDetailCommonItemSchema = z.object({
  contentid: z.string(),
  contenttypeid: z.string(),

  title: z.string(),

  createdtime: z.string(),
  modifiedtime: z.string(),

  tel: z.string(),
  telname: z.string(),
  homepage: z.string(),

  firstimage: z.string(),
  firstimage2: z.string(),
  cpyrhtDivCd: z.string(),

  areacode: z.string(),
  sigungucode: z.string(),

  lDongRegnCd: z.string(),
  lDongSignguCd: z.string(),

  lclsSystm1: z.string(),
  lclsSystm2: z.string(),
  lclsSystm3: z.string(),

  cat1: z.string(),
  cat2: z.string(),
  cat3: z.string(),

  addr1: z.string(),
  addr2: z.string(),
  zipcode: z.string(),

  mapx: z.string(),
  mapy: z.string(),
  mlevel: z.string(),

  overview: z.string(),
});

export const tourDetailCommonResponseSchema =
  createTourApiResponseSchema(
    tourDetailCommonItemSchema,
  );

export type TourDetailCommonItemDto = z.infer<
  typeof tourDetailCommonItemSchema
>;

export type TourDetailCommonResponseDto = z.infer<
  typeof tourDetailCommonResponseSchema
>;