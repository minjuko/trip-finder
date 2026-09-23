import { z } from "zod";

import { createTourApiResponseSchema } from "./common";

// detailInfo2는 콘텐츠 유형에 따라 필드가 달라지므로 공통 envelope만 검증하고
// 정규화 단계에서 의미 있는 문자열 필드만 선택한다.
export const tourDetailInfoItemSchema = z.record(z.string(), z.unknown());

export const tourDetailInfoResponseSchema = createTourApiResponseSchema(
  tourDetailInfoItemSchema,
);

export type TourDetailInfoItemDto = z.infer<typeof tourDetailInfoItemSchema>;
