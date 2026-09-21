import type {
  PaginatedResult,
  TourContent,
} from "@/types/tour";

import { requestTourApi } from "./client";
import { createTourApiError } from "./errors";
import { normalizeTourListResponse } from "./normalizers/tour-content";
import { tourListResponseSchema } from "./schemas/list";

import { TOUR_API_CACHE } from "./cache";

interface GetAreaBasedListParams {
  regionCode?: string;
  districtCode?: string;
  contentTypeId?: string;

  // 변경: TourAPI 신분류체계 1~3단계 필터 지원
  classificationDepth1?: string;
  classificationDepth2?: string;
  classificationDepth3?: string;

  page?: number;
  pageSize?: number;
}

export const getAreaBasedList = async ({
  regionCode,
  districtCode,
  contentTypeId,

  // 변경: 신분류체계 필터 parameter 추가
  classificationDepth1,
  classificationDepth2,
  classificationDepth3,

  page = 1,
  pageSize = 12,
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

  // 변경: 신분류체계 필터를 실제 TourAPI parameter로 변환
  if (classificationDepth1) {
    params.lclsSystm1 = classificationDepth1;
  }

  if (classificationDepth2) {
    params.lclsSystm2 = classificationDepth2;
  }

  if (classificationDepth3) {
    params.lclsSystm3 = classificationDepth3;
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