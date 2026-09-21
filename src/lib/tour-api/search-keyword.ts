import type {
  PaginatedResult,
  TourContent,
} from "@/types/tour";

import { TOUR_API_CACHE } from "./cache";
import { requestTourApi } from "./client";
import { createTourApiError } from "./errors";
import { normalizeTourListResponse } from "./normalizers/tour-content";
import { tourListResponseSchema } from "./schemas/list";

interface SearchKeywordParams {
  keyword: string;
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

export const searchKeyword = async ({
  keyword,
  regionCode,
  districtCode,
  contentTypeId,

  // 변경: 신분류체계 필터 parameter 추가
  classificationDepth1,
  classificationDepth2,
  classificationDepth3,

  page = 1,
  pageSize = 12,
}: SearchKeywordParams): Promise<
  PaginatedResult<TourContent>
> => {
  const normalizedKeyword = keyword.trim();

  if (!normalizedKeyword) {
    throw new Error("keyword is required");
  }

  const params: Record<string, string | number> = {
    keyword: normalizedKeyword,
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

  const rawData = await requestTourApi("searchKeyword2", {
    params,
    // 변경: 동일 검색 조건 결과는 10분 재검증
    cacheOptions: TOUR_API_CACHE.CONTENT_LIST,
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
