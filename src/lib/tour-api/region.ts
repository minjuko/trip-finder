import type { RegionOption } from "@/types/tour";

import { TOUR_API_CACHE } from "./cache";
import { requestTourApi } from "./client";
import { TourApiError } from "./errors";
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
}: GetRegionsParams = {}): Promise<
  RegionOption[]
> => {
  const params: Record<
    string,
    string | number
  > = {
    pageNo: page,
    numOfRows: pageSize,
  };

  if (regionCode) {
    params.lDongRegnCd = regionCode;
  }

  const rawData = await requestTourApi(
    "ldongCode2",
    {
      params,

      // 변경: 법정동 코드 데이터는 24시간 재검증
      cacheOptions: TOUR_API_CACHE.CODE,
    },
  );

  const parsed =
    regionResponseSchema.parse(rawData);

  const { header } = parsed.response;

  if (header.resultCode !== "0000") {
    throw new TourApiError(
      "SERVER_ERROR",
      header.resultMsg,
      header.resultCode,
    );
  }

  // 변경: 기존 Region normalizer를 그대로 사용
  return normalizeRegionResponse(parsed);
};