import type {
  ClassificationOption,
} from "@/types/tour";

import { TOUR_API_CACHE } from "./cache";
import { requestTourApi } from "./client";
import { TourApiError } from "./errors";
import {
  normalizeClassificationResponse,
} from "./normalizers/classification";
import {
  classificationResponseSchema,
} from "./schemas/classification";

interface GetClassificationOptionsParams {
  depth1Code?: string;
  depth2Code?: string;
  page?: number;
  pageSize?: number;
}

export const getClassificationOptions =
  async ({
    depth1Code,
    depth2Code,
    page = 1,
    pageSize = 100,
  }: GetClassificationOptionsParams = {}): Promise<
    ClassificationOption[]
  > => {
    const params: Record<
      string,
      string | number
    > = {
      pageNo: page,
      numOfRows: pageSize,
    };

    if (depth1Code) {
      params.lclsSystm1 = depth1Code;
    }

    if (depth2Code) {
      params.lclsSystm2 = depth2Code;
    }

    const rawData = await requestTourApi(
      "lclsSystmCode2",
      {
        params,

        // 변경: 관광 분류 코드는 24시간 재검증
        cacheOptions: TOUR_API_CACHE.CODE,
      },
    );

    const parsed =
      classificationResponseSchema.parse(
        rawData,
      );

    const { header } = parsed.response;

    if (header.resultCode !== "0000") {
      throw new TourApiError(
        "SERVER_ERROR",
        header.resultMsg,
        header.resultCode,
      );
    }

    // 변경: 기존 response normalizer 사용
    return normalizeClassificationResponse(
      parsed,
    );
  };