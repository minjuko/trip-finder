import { z } from "zod";

import { createTourApiResponseSchema } from "./common";

export const tourListItemSchema = z.object({
  addr1: z.string(),
  addr2: z.string(),
  zipcode: z.string(),

  contentid: z.string(),
  contenttypeid: z.string(),

  title: z.string(),
  tel: z.string(),

  firstimage: z.string(),
  firstimage2: z.string(),
  cpyrhtDivCd: z.string(),

  mapx: z.string(),
  mapy: z.string(),
  mlevel: z.string(),

  createdtime: z.string(),
  modifiedtime: z.string(),

  areacode: z.string(),
  sigungucode: z.string(),

  cat1: z.string(),
  cat2: z.string(),
  cat3: z.string(),

  lDongRegnCd: z.string(),
  lDongSignguCd: z.string(),

  lclsSystm1: z.string(),
  lclsSystm2: z.string(),
  lclsSystm3: z.string(),
});

export const tourListResponseSchema =
  createTourApiResponseSchema(tourListItemSchema);

export type TourListItemDto = z.infer<typeof tourListItemSchema>;

export type TourListResponseDto = z.infer<typeof tourListResponseSchema>;