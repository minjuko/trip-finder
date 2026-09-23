import type { InformationItem } from "@/types/tour";

import { TOUR_API_CACHE } from "./cache";
import { requestTourApi } from "./client";
import { createTourApiError } from "./errors";
import { normalizeTourDetailIntroItem } from "./normalizers/detail-intro";
import { tourDetailIntroResponseSchema } from "./schemas/detail-intro";

const SUPPORTED_CONTENT_TYPE_IDS = ["12", "14", "39"] as const;

type SupportedContentTypeId = (typeof SUPPORTED_CONTENT_TYPE_IDS)[number];

// 변경: orchestration 계층에서도 지원 여부를 판단할 수 있도록 export
export const isSupportedDetailIntroContentTypeId = (
  value: string,
): value is SupportedContentTypeId =>
  SUPPORTED_CONTENT_TYPE_IDS.some((contentTypeId) => contentTypeId === value);

interface GetTourDetailIntroParams {
  contentId: string;
  contentTypeId: string;
}

export const getTourDetailIntro = async ({
  contentId,
  contentTypeId,
}: GetTourDetailIntroParams): Promise<InformationItem[]> => {
  const normalizedContentId = contentId.trim();

  const normalizedContentTypeId = contentTypeId.trim();

  if (!normalizedContentId) {
    throw new Error("contentId is required");
  }

  if (!normalizedContentTypeId) {
    throw new Error("contentTypeId is required");
  }

  // 현재 MVP에서 실제 응답 계약을 검증한 contentType만 허용
  if (!isSupportedDetailIntroContentTypeId(normalizedContentTypeId)) {
    throw new Error(`Unsupported contentTypeId: ${normalizedContentTypeId}`);
  }

  // 실제 GW API 검증 결과에 따라
  // contentId + contentTypeId만 전달
  const rawData = await requestTourApi("detailIntro2", {
    params: {
      contentId: normalizedContentId,
      contentTypeId: normalizedContentTypeId,
    },
    cacheOptions: TOUR_API_CACHE.CONTENT_DETAIL,
  });

  const parsed = tourDetailIntroResponseSchema.parse(rawData);

  const { header, body } = parsed.response;

  if (header.resultCode !== "0000") {
    throw createTourApiError(header.resultCode, header.resultMsg);
  }

  if (body.items === "") {
    return [];
  }

  const item = body.items.item[0];

  if (!item) {
    return [];
  }

  // 요청한 contentType과 실제 응답의 contentType 불일치 방어
  if (item.contenttypeid !== normalizedContentTypeId) {
    throw new Error("TourAPI detailIntro contentTypeId mismatch");
  }

  return normalizeTourDetailIntroItem(item);
};
