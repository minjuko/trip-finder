import type { RepeatingInfoItem } from "@/types/tour";

import { TOUR_API_CACHE } from "./cache";
import { requestTourApi } from "./client";
import { createTourApiError } from "./errors";
import { normalizeTourDetailInfo } from "./normalizers/detail-info";
import { tourDetailInfoResponseSchema } from "./schemas/detail-info";

export const getTourDetailInfo = async ({
  contentId,
  contentTypeId,
}: {
  contentId: string;
  contentTypeId: string;
}): Promise<RepeatingInfoItem[]> => {
  const normalizedContentId = contentId.trim();
  const normalizedContentTypeId = contentTypeId.trim();

  if (!normalizedContentId || !normalizedContentTypeId) {
    throw new Error("contentId and contentTypeId are required");
  }

  const rawData = await requestTourApi("detailInfo2", {
    params: {
      contentId: normalizedContentId,
      contentTypeId: normalizedContentTypeId,
    },
    cacheOptions: TOUR_API_CACHE.CONTENT_DETAIL,
  });

  const parsed = tourDetailInfoResponseSchema.parse(rawData);
  const { header, body } = parsed.response;

  if (header.resultCode !== "0000") {
    throw createTourApiError(header.resultCode, header.resultMsg);
  }

  if (body.items === "") {
    return [];
  }

  return normalizeTourDetailInfo(body.items.item);
};
