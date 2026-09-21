import type { TourImage } from "@/types/tour";

import { TOUR_API_CACHE } from "./cache";
import { requestTourApi } from "./client";
import { createTourApiError } from "./errors";
import { normalizeTourDetailImageResponse } from "./normalizers/detail-image";
import { tourDetailImageResponseSchema } from "./schemas/detail-image";

export const getTourDetailImages = async (
  contentId: string,
): Promise<TourImage[]> => {
  const normalizedContentId =
    contentId.trim();

  if (!normalizedContentId) {
    throw new Error(
      "contentId is required",
    );
  }

  // 변경: 실제 GW API 검증 결과에 따라
  // contentId만 전달
  const rawData = await requestTourApi(
    "detailImage2",
    {
      params: {
        contentId: normalizedContentId,
      },
      cacheOptions:
        TOUR_API_CACHE.CONTENT_DETAIL,
    },
  );

  const parsed =
    tourDetailImageResponseSchema.parse(
      rawData,
    );

  const { header } = parsed.response;

  if (header.resultCode !== "0000") {
    throw createTourApiError(
      header.resultCode,
      header.resultMsg,
    );
  }

  return normalizeTourDetailImageResponse(
    parsed,
  );
};