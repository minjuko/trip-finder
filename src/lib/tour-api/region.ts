import type { RegionOption } from "@/types/tour";

import { requestTourApi } from "./client";
import { createTourApiError } from "./errors";
import { normalizeRegionResponse } from "./normalizers/region";
import { regionResponseSchema } from "./schemas/region";

interface GetRegionsParams {
  regionCode?: string;
  page?: number;
  pageSize?: number;
}

export const getRegions = async ({
  regionCode,
  page = 1,
  pageSize = 100,
}: GetRegionsParams = {}): Promise<RegionOption[]> => {
  const params: Record<string, string | number> = {
    pageNo: page,
    numOfRows: pageSize,
  };

  if (regionCode) {
    // 변경: 하위 시군구 조회 시 상위 법정동 지역 코드 전달
    params.lDongRegnCd = regionCode;
  }

  const rawData = await requestTourApi("ldongCode2", {
    params,
  });

  const parsed = regionResponseSchema.parse(rawData);
  const { header } = parsed.response;

  if (header.resultCode !== "0000") {
    throw createTourApiError(
      header.resultCode,
      header.resultMsg,
    );
  }

  return normalizeRegionResponse(parsed);
};