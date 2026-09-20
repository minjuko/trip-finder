import type {
  PaginatedResult,
  TourContent,
} from "@/types/tour";

import { createTourApiError } from "./errors";
import { normalizeTourListResponse } from "./normalizers/tour-content";
import { tourListResponseSchema } from "./schemas/list";
import { requestTourApi } from "./client";

interface GetAreaBasedListParams {
  page?: number;
  pageSize?: number;
  regionCode?: string;
  districtCode?: string;
  contentTypeId?: string;
}

export const getAreaBasedList = async ({
  page = 1,
  pageSize = 12,
  regionCode,
  districtCode,
  contentTypeId,
}: GetAreaBasedListParams = {}): Promise<
  PaginatedResult<TourContent>
> => {
  const params: Record<string, string | number> = {
    pageNo: page,
    numOfRows: pageSize,
    arrange: "A",
  };

  if (regionCode) {
    params.lDongRegnCd = regionCode;
  }

  if (districtCode) {
    params.lDongSignguCd = districtCode;
  }

  if (contentTypeId) {
    params.contentTypeId = contentTypeId;
  }

  const rawData = await requestTourApi("areaBasedList2", {
    params,
  });

  const parsed = tourListResponseSchema.parse(rawData);

  const { header } = parsed.response;

  if (header.resultCode !== "0000") {
    throw createTourApiError(
      header.resultCode,
      header.resultMsg,
    );
  }

  return normalizeTourListResponse(parsed);
};