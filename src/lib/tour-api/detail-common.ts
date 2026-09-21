import { TOUR_API_CACHE } from "./cache";
import { requestTourApi } from "./client";
import { createTourApiError } from "./errors";
import {
  normalizeTourDetailCommonItem,
  type TourDetailCommon,
} from "./normalizers/detail-common";
import { tourDetailCommonResponseSchema } from "./schemas/detail-common";

export const getTourDetailCommon = async (
  contentId: string,
): Promise<TourDetailCommon | null> => {
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
    "detailCommon2",
    {
      params: {
        contentId: normalizedContentId,
      },
      cacheOptions:
        TOUR_API_CACHE.CONTENT_DETAIL,
    },
  );

  const parsed =
    tourDetailCommonResponseSchema.parse(
      rawData,
    );

  const { header, body } =
    parsed.response;

  if (header.resultCode !== "0000") {
    throw createTourApiError(
      header.resultCode,
      header.resultMsg,
    );
  }

  if (body.items === "") {
    return null;
  }

  const item = body.items.item[0];

  if (!item) {
    return null;
  }

  return normalizeTourDetailCommonItem(
    item,
  );
};