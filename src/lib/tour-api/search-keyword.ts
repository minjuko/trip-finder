import type {
  PaginatedResult,
  TourContent,
} from "@/types/tour";

import { requestTourApi } from "./client";
import { createTourApiError } from "./errors";
import { normalizeTourListResponse } from "./normalizers/tour-content";
import { tourListResponseSchema } from "./schemas/list";

interface SearchKeywordParams {
  keyword: string;
  page?: number;
  pageSize?: number;
  regionCode?: string;
  districtCode?: string;
  contentTypeId?: string;
}

export const searchKeyword = async ({
  keyword,
  page = 1,
  pageSize = 12,
  regionCode,
  districtCode,
  contentTypeId,
}: SearchKeywordParams): Promise<PaginatedResult<TourContent>> => {
  const trimmedKeyword = keyword.trim();

  if (!trimmedKeyword) {
    throw new Error("keyword is required");
  }

  const params: Record<string, string | number> = {
    keyword: trimmedKeyword,
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

  const rawData = await requestTourApi("searchKeyword2", {
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